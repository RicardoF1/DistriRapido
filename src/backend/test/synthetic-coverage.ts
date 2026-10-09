import { readFileSync, writeFileSync, mkdirSync, mkdtempSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { tmpdir } from 'node:os';
import type { CoverageReference } from '../src/coverage/coverage.service';
export const synthetic = JSON.parse(readFileSync(resolve(__dirname, '../../../test-fixtures/coverage-synthetic.json'), 'utf8')) as { release: CoverageReference; files: Record<string,string>; points: { id:string; coordinates:[number,number]; expected_covered:boolean; expected_district?:string }[] };
export function syntheticPackage() {
  const directory=mkdtempSync(join(tmpdir(), 'distrirapido-synthetic-')); mkdirSync(directory,{recursive:true});
  for(const [name, bytes] of Object.entries(synthetic.files)) writeFileSync(join(directory,name),bytes);
  writeFileSync(join(directory,'manifest.json'),JSON.stringify(synthetic.release)); return directory;
}
