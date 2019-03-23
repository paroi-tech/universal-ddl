import { generateDdl, parseDdl } from "../src/api"

const inputs = [
  `create table t1 (
  a integer
);`,

  `create table t1 (
  a integer
);

create table t2 (
  a integer
);`,

  `alter table t1 add constraint u1 unique (a);`,
  `alter table t1 add unique (a);`,
  `alter table t1 add unique (a); -- inline com`,
  `-- block com
alter table t1 add unique (a); -- inline com`,
  `alter table t1 add unique (a); -- inline com

-- block com`,

  `create table t1 (
  a bigint not null primary key autoincrement
);`,

  `create table t1 (
  a bigint not null primary key references t2 (a)
);`,

  `create table t1 (
  a bigint not null primary key references t2
);`,

  `create table t1 (
  primary key (a)
);`,

  `create table t1 (
  foreign key (a) references t2 (a)
);`,

  `create table t1 (
  foreign key (a) references t2
);`,

  `-- A
-- B

-- C
-- D

create table t1 (
  -- E
  -- F

  a varchar(20),

  -- G
  -- H

  b varchar(20)

  -- I
  -- J
);

-- K
-- L

-- M
-- N`,
]

describe("Dialect Generator Specification for Universal DDL", () => {
  for (const [index, input] of inputs.entries()) {
    test(`Universal DDL generator, input = output #${index}`, () => {
      const ast = parseDdl(input, { freeze: true })
      expect(generateDdl(ast, "universalddl")).toEqual(input)
    })
  }
})
