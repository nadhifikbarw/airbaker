import { describe, it, expect } from "vitest";
import { Chemist } from "../src/chemist";

const c = new Chemist();

describe("default behavior", () => {
  it("should return early on empty params", () => {
    expect(c.formulate({})).toBe('');
  });

  it("should throw error on unknown schema", () => {
    // @ts-ignore deliberate
    expect(() => c.formulate({ z: { z: true }})).toThrowError();
  })
})

describe("match filter", () => {
  it("should accept string", () => {
    expect(c.formulate({ RecordId: "ID" })).toBe('{RecordId}="ID"');
  });

  it("should accept number", () => {
    expect(c.formulate({ RecordId: 1 })).toBe('{RecordId}="1"');
  });

  it("should accept null value", () => {
    expect(c.formulate({ RecordId: null })).toBe("{RecordId}=BLANK()");
  });

  it("should accept empty string", () => {
    expect(c.formulate({ RecordId: "" })).toBe("{RecordId}=BLANK()");
  });
});

describe("not match filter", () => {
  it("should accept string", () => {
    expect(c.formulate({ RecordId: { not: "ID" } })).toBe(
      'NOT({RecordId}="ID")',
    );
  });

  it("should accept number", () => {
    expect(c.formulate({ RecordId: { not: 1 } })).toBe('NOT({RecordId}="1")');
  });

  it("should accept null value", () => {
    expect(c.formulate({ RecordId: { not: null } })).toBe(
      "NOT({RecordId}=BLANK())",
    );
  });

  it("should accept empty string", () => {
    expect(c.formulate({ RecordId: { not: "" } })).toBe(
      "NOT({RecordId}=BLANK())",
    );
  });
});

describe("includes filter", () => {
  it("should accept string[]", () => {
    expect(c.formulate({ RecordId: ["ID1", "ID2"] })).toBe(
      'OR({RecordId}="ID1",{RecordId}="ID2")',
    );
  });

  it("should accept number[]", () => {
    expect(c.formulate({ RecordId: [1, 2] })).toBe(
      'OR({RecordId}="1",{RecordId}="2")',
    );
  });

  it("should accept (string|number)[]", () => {
    expect(c.formulate({ RecordId: ["ID1", 2] })).toBe(
      'OR({RecordId}="ID1",{RecordId}="2")',
    );
  });

  it("should accept empty []", () => {
    expect(c.formulate({ RecordId: [] })).toBe("{RecordId}=BLANK()");
  });

  it("should accept (string|number)[] with duplicating values", () => {
    expect(c.formulate({ RecordId: [1, 1, 2, "2"] })).toBe(
      'OR({RecordId}="1",{RecordId}="2")',
    );
  });
});

describe("not includes filter", () => {
  it("should accept string[]", () => {
    expect(c.formulate({ RecordId: { not: ["ID1", "ID2"] } })).toBe(
      'NOT(OR({RecordId}="ID1",{RecordId}="ID2"))',
    );
  });

  it("should accept number[]", () => {
    expect(c.formulate({ RecordId: { not: [1, 2] } })).toBe(
      'NOT(OR({RecordId}="1",{RecordId}="2"))',
    );
  });

  it("should accept (string|number)[]", () => {
    expect(c.formulate({ RecordId: { not: ["ID1", 2] } })).toBe(
      'NOT(OR({RecordId}="ID1",{RecordId}="2"))',
    );
  });

  it("should accept empty []", () => {
    expect(c.formulate({ RecordId: { not: [] } })).toBe(
      "NOT({RecordId}=BLANK())",
    );
  });

  it("should accept (string|number)[] with duplicating values", () => {
    expect(c.formulate({ RecordId: [1, 1, 2, "2"] })).toBe(
      'OR({RecordId}="1",{RecordId}="2")',
    );
  });
});

describe("multiple match filter", () => {
  it("should accept multi fields filter", () => {
    expect(c.formulate({ RecordId: "ID", OtherId: "ID" })).toBe(
      'AND({RecordId}="ID",{OtherId}="ID")',
    );
  });

  it("should accept mixed fields filter", () => {
    expect(c.formulate({ RecordId: "ID", OtherId: { not: "ID" } })).toBe(
      'AND({RecordId}="ID",NOT({OtherId}="ID"))',
    );
  });

  it("should accept mixed fields filter with includes", () => {
    expect(
      c.formulate({
        RecordId: "ID",
        OtherId: { not: ["ID", "ID2"] },
        AdditionalField: ["ID", "ID2"],
      }),
    ).toBe(
      "AND(" +
        '{RecordId}="ID",' +
        'NOT(OR({OtherId}="ID",{OtherId}="ID2")),' +
        'OR({AdditionalField}="ID",{AdditionalField}="ID2")' +
        ")",
    );
  });
});

describe("NOT only filter", () => {
  it("should accept string", () => {
    expect(c.formulate({ NOT: { RecordId: "ID" } })).toBe('NOT({RecordId}="ID")');
  })

  it("should accept number", () => {
    expect(c.formulate({ NOT: { RecordId: 1 } })).toBe('NOT({RecordId}="1")');
  })

  it("should accept null value", () => {
    expect(c.formulate({ NOT: { RecordId: null } })).toBe('NOT({RecordId}=BLANK())');
  })

  it("should accept empty string", () => {
    expect(c.formulate({ NOT: { RecordId: "" } })).toBe('NOT({RecordId}=BLANK())');
  })

  it("should accept (string|number)[]", () => {
    expect(c.formulate({NOT: {RecordId: ["ID1", 1]}})).toBe(
        'NOT(OR({RecordId}="ID1",{RecordId}="1"))',
    )
  });

  it("should accept mixed fields filter", () => {
    expect(c.formulate({ NOT: { RecordId: "ID", OtherId: ["ID", "ID2"]  }})).toBe(
        'NOT(AND({RecordId}="ID",OR({OtherId}="ID",{OtherId}="ID2")))',
    );
  });
})

describe("OR only filter", () => {
  it("should accept one filters", () => {
    expect(c.formulate({ OR: [
        { OtherId: ["ID", "ID2"]}
      ]})).toBe('OR({OtherId}="ID",{OtherId}="ID2")')
  })

  it("should accept multiple filters", () => {
    expect(c.formulate({ OR: [
        { RecordId: "ID"},
        { OtherId: ["ID", "ID2"]}
      ]})).toBe('OR({RecordId}="ID",OR({OtherId}="ID",{OtherId}="ID2"))')
  })
})

describe("OR and NOT filters", () => {
  it("should accept both filters", () => {
    expect(c.formulate({
      OR: [
        { RecordID: [1,2] },
        { OtherID: 1 }
      ],
      NOT: {
        RecordID: 1,
        OtherID: 1
      }
    })).toBe('AND(OR(OR({RecordID}="1",{RecordID}="2"),{OtherID}="1"),NOT(AND({RecordID}="1",{OtherID}="1")))')
  });
});

describe("value escape behavior", () => {
  it("should allow explicit escape", () => {
    expect(c.formulate({ '"RecordId"': '"Id"' })).toBe('{"RecordId"}=""Id""');
  });
});
