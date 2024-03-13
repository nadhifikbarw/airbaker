import Airtable from 'airtable';
import { FailedAttemptError } from 'p-retry';

declare class Chemist {
    /**
     * Formulate Airtable Formula from SQL-like where
     * object schema
     */
    formulate(where: ChemistWhere): string;
    private MATCH;
    private REGEX_MATCH;
    private AND;
    private OR;
    private NOT;
    private escape;
    private isOnlyOrWhere;
    private isOnlyNotWhere;
    private isOrAndNotWhere;
    private isValidRule;
    private isMatchFilter;
    private isNotMatchFilter;
    private isIncludesFilter;
    private isNotIncludesFilter;
}
type MatchFilter = string | number | null;
type IncludesFilter = MatchFilter[];
type NotMatchFilter = {
    not: MatchFilter;
};
type NotIncludesFilter = {
    not: IncludesFilter;
};
type Filter = MatchFilter | NotMatchFilter | IncludesFilter | NotIncludesFilter;
type WithoutNotFilter = Exclude<Filter, NotMatchFilter | NotIncludesFilter>;
type Rule = {
    [K: string]: Filter;
} & {
    OR?: never;
    NOT?: never;
};
type WithoutNotRule = {
    [K: string]: WithoutNotFilter;
} & {
    OR?: never;
    NOT?: never;
};
type OnlyOrWhere = {
    OR: Rule[];
} & {
    NOT?: never;
};
type OnlyNotWhere = {
    NOT: WithoutNotRule;
} & {
    OR?: never;
};
type OrAndNotWhere = {
    OR: WithoutNotRule[];
    NOT: WithoutNotRule;
};
type ChemistWhere = Rule | OnlyOrWhere | OnlyNotWhere | OrAndNotWhere;

declare class Airbaker extends Airtable {
    readonly chemist: Chemist;
    private readonly log;
    private readonly redis;
    private readonly rateLimited;
    constructor(options: Options);
    /**
     * Fetch all records from specified table
     */
    fetchAll<Fields extends Airtable.FieldSet = any>(table: Airtable.Table<Fields>, options?: Airtable.SelectOptions<Fields>): Promise<Airtable.Records<Fields>>;
    /**
     * Find first record using specified filter
     */
    findOne<Fields extends Airtable.FieldSet = any>(table: Airtable.Table<Fields>, options?: ChemistWhereable<Airtable.SelectOptions<Fields>>): Promise<Airtable.Record<Fields> | null>;
    /**
     * Find multiple records using specified filter
     *
     * This is not designed for pagination feature since it always call `all()` API.
     */
    findMany<Fields extends Airtable.FieldSet = any>(table: Airtable.Table<Fields>, options?: ChemistWhereable<Airtable.SelectOptions<Fields>>): Promise<Airtable.Records<Fields>>;
    createOne<Fields extends Airtable.FieldSet = any>(table: Airtable.Table<Fields>, data: Partial<Fields>): Promise<Airtable.Record<Fields>>;
    createMany<Fields extends Airtable.FieldSet = any>(table: Airtable.Table<Fields>, data: CreateRecordData<Fields>[]): Promise<Airtable.Records<Fields>>;
    updateOne<Fields extends Airtable.FieldSet = any>(table: Airtable.Table<Fields>, recordId: string, data: Partial<Fields>): Promise<Airtable.Record<Fields>>;
    updateMany<Fields extends Airtable.FieldSet = any>(table: Airtable.Table<Fields>, data: Airtable.RecordData<Fields>[]): Promise<Airtable.Records<Fields>>;
    upsert<Fields extends Airtable.FieldSet = any>(table: Airtable.Table<Fields>, where: ChemistWhere, data: Partial<Fields>): Promise<Airtable.Record<Fields>>;
    private runWhenAllowed;
    private isRequestAllowed;
    private genId;
}
type BackoffError = Error & {
    baseId?: string;
};
type BackoffFailedAttemptError = FailedAttemptError & {
    baseId: string;
};
type CreateRecordData<Fields extends Airtable.FieldSet> = Pick<Airtable.Record<Fields>, "fields">;
type ChemistWhereable<O> = O & {
    where?: ChemistWhere;
};
type Options = {
    apiKey: string;
    requestTimeout?: number;
    noRetryIfRateLimited?: boolean | null;
    redis?: AbstractRedis | null;
    logger?: ((...args: any[]) => any) | null;
};
interface AbstractRedis {
    setex: (key: string, seconds: number, value: number) => Promise<any>;
    eval: (script: string, numkeys: number, args: string[]) => Promise<number>;
}

export { type AbstractRedis, Airbaker, type BackoffError, type BackoffFailedAttemptError, type ChemistWhereable, type CreateRecordData, type Options };
