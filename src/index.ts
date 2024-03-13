import { randomUUID } from "node:crypto";
import Airtable from "airtable";
import pRetry, { AbortError, type FailedAttemptError } from "p-retry";
import { isNil, omitBy, concat, chunk, omit } from "lodash-es";
import { Chemist, type ChemistWhere } from "./chemist.js";

export class Airbaker extends Airtable {
  readonly chemist: Chemist;
  private readonly log: (...args: any[]) => any;
  private readonly redis: AbstractRedis | null;
  private readonly rateLimited: boolean;

  constructor(options: Options) {
    const noRetryIfRateLimited =
      typeof options.noRetryIfRateLimited === "boolean"
        ? options.noRetryIfRateLimited
        : false;
    const rateLimited = !!(!noRetryIfRateLimited && options.redis);

    const $options: Airtable.AirtableOptions = {
      apiKey: options.apiKey,
      requestTimeout: options.requestTimeout,
      // When using Redis rate limiter, Airbaker need to set this as true
      // since Airbaker will be the one managing rate limit occurrence
      noRetryIfRateLimited: rateLimited ? true : noRetryIfRateLimited,
    };
    super($options);

    this.rateLimited = rateLimited;
    this.redis = options.redis || null;

    // Attach Chemist
    this.chemist = new Chemist();

    // Attach logger
    this.log = typeof options.logger === "function" ? options.logger : () => {};
  }

  /**
   * Fetch all records from specified table
   */
  async fetchAll<Fields extends Airtable.FieldSet = any>(
    table: Airtable.Table<Fields>,
    options: Airtable.SelectOptions<Fields> = {},
  ): Promise<Airtable.Records<Fields>> {
    const id = this.genId();

    let $options: Airtable.SelectOptions<Fields> = {
      ...options,
      // Due to how pagination is implemented, it's beneficial to
      // ensure we call the API with maximum allowed pageSize to reduce
      // round-trips required
      // https://github.com/Airtable/airtable.js/blob/master/src/query.ts
      // https://airtable.com/developers/web/api/list-records#query-maxrecords
      pageSize: 100,
    };

    if ($options.offset) {
      delete $options.offset;
    }
    if ($options.filterByFormula) {
      delete $options.filterByFormula;
    }

    $options = omitBy($options, isNil);

    this.log(
      `[${id}] Fetching all records from ${table._base.getId()}:${table.name} with ${JSON.stringify($options)}`,
    );

    let currentPage = 0;
    const records: Airtable.Record<Fields>[] = [];
    await this.runWhenAllowed(table._base.getId(), () => {
      return table
        .select($options)
        .eachPage(async (pageRecords, processNextPage) => {
          currentPage++;
          this.log(`[${id}] Page ${currentPage} records fetched`);

          records.push(...pageRecords);
          await this.runWhenAllowed(table._base.getId(), processNextPage);
        });
    });

    this.log(
      `[${id}] Found ${records.length > 0 ? records.length : 0} record(s)`,
    );

    return records;
  }

  /**
   * Find first record using specified filter
   */
  async findOne<Fields extends Airtable.FieldSet = any>(
    table: Airtable.Table<Fields>,
    options: ChemistWhereable<Airtable.SelectOptions<Fields>> = {},
  ): Promise<Airtable.Record<Fields> | null> {
    const id = this.genId();

    // Resolve `where` supports
    let $filterByFormula = "";
    if (options.where) {
      $filterByFormula = this.chemist.formulate(options.where);
    }

    // Resolve options
    let $options: ChemistWhereable<Airtable.SelectOptions<Fields>> = {
      ...options,
      maxRecords: 1,
      filterByFormula: $filterByFormula || options.filterByFormula,
      // Client will try to use 'post' mode query to circumvent 16kb limit on GET requests
      // https://airtable.com/developers/web/api/list-records#query-filterbyformula
    };

    // Remove processed `where` before making request
    if ($options.where) {
      delete $options.where;
    }

    $options = omitBy($options, isNil);

    this.log(
      `[${id}] Find first record from ${table._base.getId()}:${table.name} with ${JSON.stringify($options)}`,
    );

    const records = await this.runWhenAllowed(table._base.getId(), () =>
      table.select($options).firstPage(),
    );
    this.log(`[${id}] Page 1 records fetched`);

    this.log(
      `[${id}] Found ${records.length > 0 ? records.length : 0} record(s)`,
    );

    return records.length > 0 ? records[0] : null;
  }

  /**
   * Find multiple records using specified filter
   *
   * This is not designed for pagination feature since it always call `all()` API.
   */
  async findMany<Fields extends Airtable.FieldSet = any>(
    table: Airtable.Table<Fields>,
    options: ChemistWhereable<Airtable.SelectOptions<Fields>> = {},
  ): Promise<Airtable.Records<Fields>> {
    const id = this.genId();

    // Resolve `where` supports
    let $filterByFormula = "";
    if (options.where) {
      $filterByFormula = this.chemist.formulate(options.where);
    }

    // Resolve options
    let $options: ChemistWhereable<Airtable.SelectOptions<Fields>> = {
      pageSize: 100, // Optimize round-trips
      ...options,
      filterByFormula: $filterByFormula || options.filterByFormula,
    };

    // Remove processed `where` before sending to client
    if ($options.where) {
      delete $options.where;
    }

    $options = omitBy($options, isNil);

    this.log(
      `[${id}] Find multiple records from ${table._base.getId()}:${table.name} with ${JSON.stringify($options)}`,
    );

    let currentPage = 0;
    const records: Array<Airtable.Record<Fields>> = [];
    await this.runWhenAllowed(table._base.getId(), () => {
      return table
        .select($options)
        .eachPage(async (pageRecords, processNextPage) => {
          currentPage++;
          this.log(`[${id}] Page ${currentPage} records fetched`);

          records.push(...pageRecords);
          await this.runWhenAllowed(table._base.getId(), processNextPage);
        });
    });

    this.log(
      `[${id}] Found ${records.length > 0 ? records.length : 0} record(s)`,
    );

    return records.length > 0 ? records : [];
  }

  async createOne<Fields extends Airtable.FieldSet = any>(
    table: Airtable.Table<Fields>,
    data: Partial<Fields>,
  ): Promise<Airtable.Record<Fields>> {
    const id = this.genId();

    this.log(
      `[${id}] Creating record for ${table._base.getId()}:${table.name} with ${JSON.stringify(data)}`,
    );

    const record = await this.runWhenAllowed(table._base.getId(), () =>
      table.create(data, { typecast: true }),
    );

    this.log(`[${id}}] Created record: ${record.getId()}`);

    return record;
  }

  async createMany<Fields extends Airtable.FieldSet = any>(
    table: Airtable.Table<Fields>,
    data: CreateRecordData<Fields>[],
  ): Promise<Airtable.Records<Fields>> {
    if (data.length === 0) {
      throw new Error("Empty Array provided when creating Airtable records");
    }

    const id = this.genId();

    this.log(
      `[${id}] Creating records for ${table._base.getId()}:${table.name} with ${JSON.stringify(data)}`,
    );

    // Handle automatic batch splitting since Airtable only allows up to 10 records insert batch per request
    // https://support.airtable.com/docs/managing-api-call-limits-in-airtable#rate-limit-management-strategies
    const batchResults = await Promise.all(
      chunk(data, 10).map(async (batch) => {
        return await this.runWhenAllowed(table._base.getId(), () =>
          table.create(batch, { typecast: true }),
        );
      }),
    );

    const records = concat(...batchResults);

    this.log(
      `[${id}}] Created records: ${records.map((r) => r.getId()).join(",")}`,
    );

    return records;
  }

  async updateOne<Fields extends Airtable.FieldSet = any>(
    table: Airtable.Table<Fields>,
    recordId: string,
    data: Partial<Fields>,
  ): Promise<Airtable.Record<Fields>> {
    const id = this.genId();

    this.log(
      `[${id}] Updating record ${recordId} for ${table._base.getId()}:${table.name} with ${JSON.stringify(data)}`,
    );

    const record = await this.runWhenAllowed(table._base.getId(), () =>
      table.update(recordId, data, { typecast: true }),
    );

    this.log(`[${id}] Updated record: ${record.getId()}`);

    return record;
  }

  async updateMany<Fields extends Airtable.FieldSet = any>(
    table: Airtable.Table<Fields>,
    data: Airtable.RecordData<Fields>[],
  ): Promise<Airtable.Records<Fields>> {
    if (data.length === 0) {
      throw new Error("Empty Array provided when creating Airtable records");
    }

    const id = this.genId();

    this.log(
      `[${id}] Updating records for ${table._base.getId()}:${table.name} with ${JSON.stringify(data)}`,
    );

    // Handle automatic batch splitting since Airtable only allows up to 50 records update batch per request
    // https://support.airtable.com/docs/managing-api-call-limits-in-airtable#rate-limit-management-strategies
    const batchResults = await Promise.all(
      chunk(data).map(async (batch) => {
        return await this.runWhenAllowed(table._base.getId(), () =>
          table.update(batch, { typecast: true }),
        );
      }),
    );

    const records = concat(...batchResults) as Airtable.Records<Fields>;

    this.log(
      `[${id}] Updated records: ${records.map((r) => r.getId()).join(",")}`,
    );

    return records;
  }

  async upsert<Fields extends Airtable.FieldSet = any>(
    table: Airtable.Table<Fields>,
    where: ChemistWhere,
    data: Partial<Fields>,
  ): Promise<Airtable.Record<Fields>> {
    const id = this.genId();

    this.log(
      `[${id}] Upsert record for ${table._base.getId()}:${table.name} with ${JSON.stringify(data)}`,
    );
    const existingRecord = await this.findOne(table, { where });

    let freshRecord: Airtable.Record<Fields>;
    if (existingRecord) {
      this.log(
        `[${id}]] Existing record found for upsert with ${JSON.stringify(where)}`,
      );
      const lockedFields = Object.keys(existingRecord.fields);

      data = omit(data, lockedFields) as Partial<Fields>;

      freshRecord = await this.updateOne(table, existingRecord.id, data);
    } else {
      this.log(
        `[${id}]] Existing record not found for upsert with ${JSON.stringify(where)}`,
      );
      freshRecord = await this.createOne(table, data);
    }

    return freshRecord;
  }

  private async runWhenAllowed<Func extends (...args: any[]) => any>(
    baseId: string,
    fn: Func,
  ): Promise<ReturnType<Func>> {
    // Apply automatic backoff with jitter and perform retry
    // to ensure function will eventually be run whenever allowed
    return await pRetry(
      async () => {
        // Considered as internal error should never be thrown beyond runFn
        // where `rateLimited` mode is not active
        if (!(await this.isRequestAllowed(baseId))) {
          throw createBackoffError(baseId);
        }

        try {
          return await fn();
        } catch (error) {
          let $error:
            | (Error & {
                error?: string;
                statusCode?: number;
                toString?: () => string;
              })
            | undefined;

          //
          // Comply with pRetry not allowing AirtableError
          // which doesn't extend generic Error
          //
          if (isAirtableError(error)) {
            if (error.statusCode === 429) {
              this.log(`[${baseId}] Base rate limit reached`);

              if (this.redis) {
                await this.redis.setex(
                  `{airtable}:${baseId}:is_rate_limited`,
                  30,
                  1,
                );
              }

              throw createBackoffError(baseId);
            }

            const originalErr = error;
            $error = new Error(originalErr.message);
            $error.error = originalErr.error;
            $error.statusCode = originalErr.statusCode;
            $error.toString = originalErr.toString.bind(error);
          } else {
            $error = error as Error;
          }
          //
          // This extended client will not attempt to perform retry on scenario
          // on non 429 error, this behaviour is the same with the original SDK
          // behavior, this feature primarily not supported directly since SDK
          // doesn't expose granular control for `offset` value from response
          // where it's critical for API that needs to rely on behavior that
          // require correctly fetching the current page before iterating
          // to the next
          //
          throw new AbortError($error);
        }
      },
      {
        forever: true,
        minTimeout: 1000,
        maxTimeout: 1500,
        randomize: true,
        //
        // Only allow retry behaviour when `rateLimited` is true
        // this ensure default SDK behavior is guaranteed and respect
        // `noRetryIfRateLimited` value
        //
        shouldRetry: (err) => this.rateLimited && isBackoffFailedAttempt(err),
        onFailedAttempt: (err) => {
          if (isBackoffFailedAttempt(err)) {
            this.log(`Backoff triggered for ${err.baseId}`);
          }
        },
      },
    );
  }

  private async isRequestAllowed(baseId: string) {
    // If client is not rate limited, always allow request to happen
    // and respect built-in SDK behavior handling for the possibility of
    // rate limit being hit
    if (!this.rateLimited) {
      return true;
    }

    if (!this.redis) {
      throw new Error("Redis is required to perform rate limiting");
    }

    return (
      (await this.redis.eval(rateLimitScript, 2, [
        `{airtable}:${baseId}`,
        `{airtable}:${baseId}:is_rate_limited`,
        // 5 requests per 1 sec window
        "5",
        "1000000",
      ])) === 1
    );
  }

  private genId() {
    return randomUUID().split("-")[0];
  }
}

//
// Runtime Type Check for AirtableError
// since it is not an instance of Error
//
function isAirtableError(err: any): err is Airtable.Error {
  return "error" in err && "message" in err && "statusCode" in err;
}

//
// pRetry Backoff Error Utils
//
const BackoffMsg = "Airbaker Backoff";
function createBackoffError(baseId: string): BackoffError {
  const err: BackoffError = new Error(BackoffMsg);
  err.baseId = baseId;
  return err;
}
function isBackoffFailedAttempt(
  err: BackoffFailedAttemptError | FailedAttemptError,
): err is BackoffFailedAttemptError {
  return err.message === BackoffMsg;
}
export type BackoffError = Error & { baseId?: string };
export type BackoffFailedAttemptError = FailedAttemptError & { baseId: string };

export type CreateRecordData<Fields extends Airtable.FieldSet> = Pick<
  Airtable.Record<Fields>,
  "fields"
>;
export type ChemistWhereable<O> = O & { where?: ChemistWhere };
export type Options = {
  // Reexport official Airtable.js options
  apiKey: string;
  requestTimeout?: number;
  noRetryIfRateLimited?: boolean | null;
  // Custom
  redis?: AbstractRedis | null;
  logger?: ((...args: any[]) => any) | null;
};
export interface AbstractRedis {
  setex: (key: string, seconds: number, value: number) => Promise<any>;
  eval: (script: string, numkeys: number, args: string[]) => Promise<number>;
}

// Redis Lua script for rate limiting
const rateLimitScript = `
-- Sliding Log Rate Limiter
local log_key = KEYS[1] -- On Airtable, each base will have unique key

-- On Airtable, this is override feature for rate limited condition
-- and early return before hitting main algorithm
local rate_limited_key = KEYS[2]

-- If rate_limited_key is provided perform simple check whether
-- base rate limit has previously been hit
if rate_limited_key then
   if redis.call('EXISTS', rate_limited_key) == 1 then
      return 0
   end
end

local limit = ARGV[1] -- Maximum requests within a window
local window = ARGV[2] -- Window specified in MICRO seconds, 1 second time window would be 1_000_000

local time = redis.call('TIME') -- This command return [ timeInSecond: string, lapsedMicrosecond: string(6) ]
local current_time = tonumber(time[1]..time[2])
local window_start_time = current_time - window

-- Cleanup lapsed logs outside time window
redis.call('ZREMRANGEBYSCORE', log_key, 0, window_start_time)

-- Get all logs that still remains within the time window
local count = redis.call('ZCARD', log_key)

if count < tonumber(limit) then
   redis.call('ZADD', log_key, current_time, current_time)
   return 1
end

return 0`;
