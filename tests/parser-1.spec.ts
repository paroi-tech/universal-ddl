import { parseDdl } from "../src/parse-ddl"

describe("test set 1", () => {
  test("parse", () => {
    const input = `
      create table person(
        id int primary key,
        name varchar(50) unique not null default 'sam',
        birthdate date default current_date,
        note float(5) foreign key references foo(bar)
      );
      `
    const ast = parseDdl(input)
    // console.log(JSON.stringify(ast, undefined, 2))
  })

  test("table_a", () => {
    const input = `
      create table table_a(
        col_a integer primary key
      );
      `
    const ast = parseDdl(input)
    // console.log(JSON.stringify(ast))
    expect(ast).toEqual({
      "tables": [
        {
          "name": "table_a",
          "columns": [
            {
              "name": "col_a",
              "type": "integer",
              "primaryKey": true
            }
          ]
        }
      ]
    })
  })
})
