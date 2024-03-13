import { uniq, escapeRegExp } from "lodash-es";

export class Chemist {
  /**
   * Formulate Airtable Formula from SQL-like where
   * object schema
   */
  formulate(where: ChemistWhere): string {
    if (Object.keys(where).length === 0) {
      return "";
    }

    // Where object without OR nor NOT
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
            filter.map(($filter) => this.MATCH(`{${fieldName}}`, $filter)),
          );
        }

        if (this.isNotIncludesFilter(filter)) {
          if (filter.not.length === 0) {
            return this.NOT(this.MATCH(`{${fieldName}}`, null));
          }

          return this.NOT(
            this.OR(
              filter.not.map(($filter) =>
                this.MATCH(`{${fieldName}}`, $filter),
              ),
            ),
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
        this.NOT(this.formulate(where.NOT)),
      ]);
    }

    throw new Error(
      `Unable to formulate where: ${JSON.stringify(where, null, 2)}`,
    );
  }

  // Airtable Formula Constructors
  private MATCH(str: string, value: string | number | null) {
    // Airtable support MATCH ing number field using string
    const $value = value === null ? "" : value.toString();

    return `${str}=${$value.length === 0 ? "BLANK()" : this.escape($value)}`;
  }

  private REGEX_MATCH(str: string, regex: string) {
    return `REGEX_MATCH(${this.escape(str)},${this.escape(escapeRegExp(regex))})`;
  }

  private AND(expressions: string[]) {
    if (expressions.length === 0) {
      return `FALSE()`;
    }
    if (expressions.length === 1) {
      return expressions[0];
    }
    return `AND(${uniq(expressions).join(",")})`;
  }

  private OR(expressions: string[]) {
    if (expressions.length === 0) {
      return `FALSE()`;
    }
    if (expressions.length === 1) {
      return expressions[0];
    }
    return `OR(${uniq(expressions).join(",")})`;
  }

  private NOT(expression: string) {
    return `NOT(${expression})`;
  }

  // Escape field reference or value
  private escape(str: string | number) {
    const $str = str.toString();
    return `"${$str}"`;
  }

  // Type narrower
  private isOnlyOrWhere(where: ChemistWhere): where is OnlyOrWhere {
    return where.OR !== undefined && where.NOT === undefined;
  }

  private isOnlyNotWhere(where: ChemistWhere): where is OnlyNotWhere {
    return where.NOT !== undefined && where.OR === undefined;
  }

  private isOrAndNotWhere(where: ChemistWhere): where is OrAndNotWhere {
    return where.OR !== undefined && where.NOT !== undefined;
  }

  private isValidRule(where: ChemistWhere): where is Rule {
    return where.OR === undefined && where.NOT === undefined;
  }

  private isMatchFilter(filter: Filter): filter is MatchFilter {
    return (
      filter === null ||
      typeof filter === "string" ||
      typeof filter === "number"
    );
  }

  private isNotMatchFilter(filter: Filter): filter is NotMatchFilter {
    return (
      !this.isMatchFilter(filter) &&
      "not" in filter &&
      this.isMatchFilter(filter.not)
    );
  }

  private isIncludesFilter(filter: Filter): filter is IncludesFilter {
    return (
      Array.isArray(filter) &&
      !filter.some(($filter) => {
        return (
          typeof $filter !== "string" &&
          typeof $filter !== "number" &&
          $filter !== null
        );
      })
    );
  }

  private isNotIncludesFilter(filter: Filter): filter is NotIncludesFilter {
    return (
      !this.isMatchFilter(filter) &&
      "not" in filter &&
      this.isIncludesFilter(filter.not)
    );
  }
}

export type MatchFilter = string | number | null;
export type IncludesFilter = MatchFilter[];
export type NotMatchFilter = { not: MatchFilter };
export type NotIncludesFilter = { not: IncludesFilter };

// TODO: possible features
// export type ContainsFilter = { contains: string };
// export type EndsWithFilter = { endsWith: string };
// export type StartsWithFilter = { startsWith: string };

export type Filter =
  | MatchFilter
  | NotMatchFilter
  | IncludesFilter
  | NotIncludesFilter;
// | ContainsFilter
// | StartsWithFilter
// | EndsWithFilter;
export type WithoutNotFilter = Exclude<
  Filter,
  NotMatchFilter | NotIncludesFilter
>;

export type Rule = { [K: string]: Filter } & { OR?: never; NOT?: never };
export type WithoutNotRule = { [K: string]: WithoutNotFilter } & {
  OR?: never;
  NOT?: never;
};

export type OnlyOrWhere = { OR: Rule[] } & { NOT?: never };
export type OnlyNotWhere = { NOT: WithoutNotRule } & { OR?: never };
export type OrAndNotWhere = { OR: WithoutNotRule[]; NOT: WithoutNotRule };
export type ChemistWhere = Rule | OnlyOrWhere | OnlyNotWhere | OrAndNotWhere;

export default Chemist;
