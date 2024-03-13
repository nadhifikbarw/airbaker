'use strict';

const node_crypto = require('node:crypto');
const Airtable = require('airtable');
const pRetry = require('p-retry');
const lodashEs = require('lodash-es');

function _interopDefaultCompat (e) { return e && typeof e === 'object' && 'default' in e ? e.default : e; }

const Airtable__default = /*#__PURE__*/_interopDefaultCompat(Airtable);
const pRetry__default = /*#__PURE__*/_interopDefaultCompat(pRetry);

class Chemist {
  /**
   * Formulate Airtable Formula from SQL-like where
   * object schema
   */
  formulate(where) {
    if (Object.keys(where).length === 0) {
      return "";
    }
    if (this.isValidRule(where)) {
      const expressions = Object.entries(where).map(([fieldName, filter]) => {
        if (this.isMatchFilter(filter)) {
          return this.MATCH(`{${fieldName}}`, filter);
        }
        if (this.isNotMatchFilter(filter)) {
          return this.NOT(this.MATCH(`{${fieldName}}`, filter.not));
        }
        if (this.isIncludesFilter(filter)) {
          if (filter.length === 0) {
            return this.MATCH(`{${fieldName}}`, null);
          }
          return this.OR(
            filter.map(($filter) => this.MATCH(`{${fieldName}}`, $filter))
          );
        }
        if (this.isNotIncludesFilter(filter)) {
          if (filter.not.length === 0) {
            return this.NOT(this.MATCH(`{${fieldName}}`, null));
          }
          return this.NOT(
            this.OR(
              filter.not.map(
                ($filter) => this.MATCH(`{${fieldName}}`, $filter)
              )
            )
          );
        }
        throw new Error(`Unable to resolve rule entry: ${fieldName}`);
      });
      return expressions.length === 1 ? expressions[0] : this.AND(expressions);
    }
    if (this.isOnlyOrWhere(where)) {
      return this.OR(where.OR.map(($OR) => this.formulate($OR)));
    }
    if (this.isOnlyNotWhere(where)) {
      return this.NOT(this.formulate(where.NOT));
    }
    if (this.isOrAndNotWhere(where)) {
      return this.AND([
        this.OR(where.OR.map(($OR) => this.formulate($OR))),
        this.NOT(this.formulate(where.NOT))
      ]);
    }
    throw new Error(
      `Unable to formulate where: ${JSON.stringify(where, null, 2)}`
    );
  }
  // Airtable Formula Constructors
  MATCH(str, value) {
    const $value = value === null ? "" : value.toString();
    return `${str}=${$value.length === 0 ? "BLANK()" : this.escape($value)}`;
  }
  REGEX_MATCH(str, regex) {
    return `REGEX_MATCH(${this.escape(str)},${this.escape(lodashEs.escapeRegExp(regex))})`;
  }
  AND(expressions) {
    if (expressions.length === 0) {
      return `FALSE()`;
    }
    if (expressions.length === 1) {
      return expressions[0];
    }
    return `AND(${lodashEs.uniq(expressions).join(",")})`;
  }
  OR(expressions) {
    if (expressions.length === 0) {
      return `FALSE()`;
    }
    if (expressions.length === 1) {
      return expressions[0];
    }
    return `OR(${lodashEs.uniq(expressions).join(",")})`;
  }
  NOT(expression) {
    return `NOT(${expression})`;
  }
  // Escape field reference or value
  escape(str) {
    const $str = str.toString();
    return `"${$str}"`;
  }
  // Type narrower
  isOnlyOrWhere(where) {
    return where.OR !== void 0 && where.NOT === void 0;
  }
  isOnlyNotWhere(where) {
    return where.NOT !== void 0 && where.OR === void 0;
  }
  isOrAndNotWhere(where) {
    return where.OR !== void 0 && where.NOT !== void 0;
  }
  isValidRule(where) {
    return where.OR === void 0 && where.NOT === void 0;
  }
  isMatchFilter(filter) {
    return filter === null || typeof filter === "string" || typeof filter === "number";
  }
  isNotMatchFilter(filter) {
    return !this.isMatchFilter(filter) && "not" in filter && this.isMatchFilter(filter.not);
  }
  isIncludesFilter(filter) {
    return Array.isArray(filter) && !filter.some(($filter) => {
      return typeof $filter !== "string" && typeof $filter !== "number" && $filter !== null;
    });
  }
  isNotIncludesFilter(filter) {
    return !this.isMatchFilter(filter) && "not" in filter && this.isIncludesFilter(filter.not);
  }
}

var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
class Airbaker extends Airtable__default {
  constructor(options) {
    const noRetryIfRateLimited = typeof options.noRetryIfRateLimited === "boolean" ? options.noRetryIfRateLimited : false;
    const rateLimited = !!(!noRetryIfRateLimited && options.redis);
    const $options = {
      apiKey: options.apiKey,
      requestTimeout: options.requestTimeout,
      // When using Redis rate limiter, Airbaker need to set this as true
      // since Airbaker will be the one managing rate limit occurrence
      noRetryIfRateLimited: rateLimited ? true : noRetryIfRateLimited
    };
    super($options);
    __publicField(this, "chemist");
    __publicField(this, "log");
    __publicField(this, "redis");
    __publicField(this, "rateLimited");
    this.rateLimited = rateLimited;
    this.redis = options.redis || null;
    this.chemist = new Chemist();
    this.log = typeof options.logger === "function" ? options.logger : () => {
    };
  }
  /**
   * Fetch all records from specified table
   */
  async fetchAll(table, options = {}) {
    const id = this.genId();
    let $options = {
      ...options,
      // Due to how pagination is implemented, it's beneficial to
      // ensure we call the API with maximum allowed pageSize to reduce
      // round-trips required
      // https://github.com/Airtable/airtable.js/blob/master/src/query.ts
      // https://airtable.com/developers/web/api/list-records#query-maxrecords
      pageSize: 100
    };
    if ($options.offset) {
      delete $options.offset;
    }
    if ($options.filterByFormula) {
      delete $options.filterByFormula;
    }
    $options = lodashEs.omitBy($options, lodashEs.isNil);
    this.log(
      `[${id}] Fetching all records from ${table._base.getId()}:${table.name} with ${JSON.stringify($options)}`
    );
    let currentPage = 0;
    const records = [];
    await this.runWhenAllowed(table._base.getId(), () => {
      return table.select($options).eachPage(async (pageRecords, processNextPage) => {
        currentPage++;
        this.log(`[${id}] Page ${currentPage} records fetched`);
        records.push(...pageRecords);
        await this.runWhenAllowed(table._base.getId(), processNextPage);
      });
    });
    this.log(
      `[${id}] Found ${records.length > 0 ? records.length : 0} record(s)`
    );
    return records;
  }
  /**
   * Find first record using specified filter
   */
  async findOne(table, options = {}) {
    const id = this.genId();
    let $filterByFormula = "";
    if (options.where) {
      $filterByFormula = this.chemist.formulate(options.where);
    }
    let $options = {
      ...options,
      maxRecords: 1,
      filterByFormula: $filterByFormula || options.filterByFormula
      // Client will try to use 'post' mode query to circumvent 16kb limit on GET requests
      // https://airtable.com/developers/web/api/list-records#query-filterbyformula
    };
    if ($options.where) {
      delete $options.where;
    }
    $options = lodashEs.omitBy($options, lodashEs.isNil);
    this.log(
      `[${id}] Find first record from ${table._base.getId()}:${table.name} with ${JSON.stringify($options)}`
    );
    const records = await this.runWhenAllowed(
      table._base.getId(),
      () => table.select($options).firstPage()
    );
    this.log(`[${id}] Page 1 records fetched`);
    this.log(
      `[${id}] Found ${records.length > 0 ? records.length : 0} record(s)`
    );
    return records.length > 0 ? records[0] : null;
  }
  /**
   * Find multiple records using specified filter
   *
   * This is not designed for pagination feature since it always call `all()` API.
   */
  async findMany(table, options = {}) {
    const id = this.genId();
    let $filterByFormula = "";
    if (options.where) {
      $filterByFormula = this.chemist.formulate(options.where);
    }
    let $options = {
      pageSize: 100,
      // Optimize round-trips
      ...options,
      filterByFormula: $filterByFormula || options.filterByFormula
    };
    if ($options.where) {
      delete $options.where;
    }
    $options = lodashEs.omitBy($options, lodashEs.isNil);
    this.log(
      `[${id}] Find multiple records from ${table._base.getId()}:${table.name} with ${JSON.stringify($options)}`
    );
    let currentPage = 0;
    const records = [];
    await this.runWhenAllowed(table._base.getId(), () => {
      return table.select($options).eachPage(async (pageRecords, processNextPage) => {
        currentPage++;
        this.log(`[${id}] Page ${currentPage} records fetched`);
        records.push(...pageRecords);
        await this.runWhenAllowed(table._base.getId(), processNextPage);
      });
    });
    this.log(
      `[${id}] Found ${records.length > 0 ? records.length : 0} record(s)`
    );
    return records.length > 0 ? records : [];
  }
  async createOne(table, data) {
    const id = this.genId();
    this.log(
      `[${id}] Creating record for ${table._base.getId()}:${table.name} with ${JSON.stringify(data)}`
    );
    const record = await this.runWhenAllowed(
      table._base.getId(),
      () => table.create(data, { typecast: true })
    );
    this.log(`[${id}}] Created record: ${record.getId()}`);
    return record;
  }
  async createMany(table, data) {
    if (data.length === 0) {
      throw new Error("Empty Array provided when creating Airtable records");
    }
    const id = this.genId();
    this.log(
      `[${id}] Creating records for ${table._base.getId()}:${table.name} with ${JSON.stringify(data)}`
    );
    const batchResults = await Promise.all(
      lodashEs.chunk(data, 10).map(async (batch) => {
        return await this.runWhenAllowed(
          table._base.getId(),
          () => table.create(batch, { typecast: true })
        );
      })
    );
    const records = lodashEs.concat(...batchResults);
    this.log(
      `[${id}}] Created records: ${records.map((r) => r.getId()).join(",")}`
    );
    return records;
  }
  async updateOne(table, recordId, data) {
    const id = this.genId();
    this.log(
      `[${id}] Updating record ${recordId} for ${table._base.getId()}:${table.name} with ${JSON.stringify(data)}`
    );
    const record = await this.runWhenAllowed(
      table._base.getId(),
      () => table.update(recordId, data, { typecast: true })
    );
    this.log(`[${id}] Updated record: ${record.getId()}`);
    return record;
  }
  async updateMany(table, data) {
    if (data.length === 0) {
      throw new Error("Empty Array provided when creating Airtable records");
    }
    const id = this.genId();
    this.log(
      `[${id}] Updating records for ${table._base.getId()}:${table.name} with ${JSON.stringify(data)}`
    );
    const batchResults = await Promise.all(
      lodashEs.chunk(data).map(async (batch) => {
        return await this.runWhenAllowed(
          table._base.getId(),
          () => table.update(batch, { typecast: true })
        );
      })
    );
    const records = lodashEs.concat(...batchResults);
    this.log(
      `[${id}] Updated records: ${records.map((r) => r.getId()).join(",")}`
    );
    return records;
  }
  async upsert(table, where, data) {
    const id = this.genId();
    this.log(
      `[${id}] Upsert record for ${table._base.getId()}:${table.name} with ${JSON.stringify(data)}`
    );
    const existingRecord = await this.findOne(table, { where });
    let freshRecord;
    if (existingRecord) {
      this.log(
        `[${id}]] Existing record found for upsert with ${JSON.stringify(where)}`
      );
      const lockedFields = Object.keys(existingRecord.fields);
      data = lodashEs.omit(data, lockedFields);
      freshRecord = await this.updateOne(table, existingRecord.id, data);
    } else {
      this.log(
        `[${id}]] Existing record not found for upsert with ${JSON.stringify(where)}`
      );
      freshRecord = await this.createOne(table, data);
    }
    return freshRecord;
  }
  async runWhenAllowed(baseId, fn) {
    return await pRetry__default(
      async () => {
        if (!await this.isRequestAllowed(baseId)) {
          throw createBackoffError(baseId);
        }
        try {
          return await fn();
        } catch (error) {
          let $error;
          if (isAirtableError(error)) {
            if (error.statusCode === 429) {
              this.log(`[${baseId}] Base rate limit reached`);
              if (this.redis) {
                await this.redis.setex(
                  `{airtable}:${baseId}:is_rate_limited`,
                  30,
                  1
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
            $error = error;
          }
          throw new pRetry.AbortError($error);
        }
      },
      {
        forever: true,
        minTimeout: 1e3,
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
        }
      }
    );
  }
  async isRequestAllowed(baseId) {
    if (!this.rateLimited) {
      return true;
    }
    if (!this.redis) {
      throw new Error("Redis is required to perform rate limiting");
    }
    return await this.redis.eval(rateLimitScript, 2, [
      `{airtable}:${baseId}`,
      `{airtable}:${baseId}:is_rate_limited`,
      // 5 requests per 1 sec window
      "5",
      "1000000"
    ]) === 1;
  }
  genId() {
    return node_crypto.randomUUID().split("-")[0];
  }
}
function isAirtableError(err) {
  return "error" in err && "message" in err && "statusCode" in err;
}
const BackoffMsg = "Airbaker Backoff";
function createBackoffError(baseId) {
  const err = new Error(BackoffMsg);
  err.baseId = baseId;
  return err;
}
function isBackoffFailedAttempt(err) {
  return err.message === BackoffMsg;
}
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

exports.Airbaker = Airbaker;
