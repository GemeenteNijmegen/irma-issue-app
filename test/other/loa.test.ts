import { DigidLoa, loaToNumber } from "../../src/app/code/DigiDLoa"

test('LOA numbers', () => {
  expect(loaToNumber(DigidLoa.Basis)).toBe(10);
  expect(loaToNumber(DigidLoa.Midden)).toBe(20);
  expect(loaToNumber(DigidLoa.Substantieel)).toBe(25);
  expect(loaToNumber(DigidLoa.Hoog)).toBe(30);
})