import initRDKit from '@rdkit/rdkit'
const RDKit = await initRDKit()
const SYM = {1:'H',6:'C',7:'N',8:'O',15:'P',16:'S',17:'Cl',35:'Br',53:'I'}
for (const s of process.argv.slice(2)) {
  const m = RDKit.get_mol(s, JSON.stringify({ removeHs: false }))
  if (!m) { console.log(s, '→ ILLISIBLE'); continue }
  const mol = JSON.parse(m.get_json()).molecules[0]
  const z = (a) => (a.z === undefined ? 6 : a.z)
  console.log('\n=== ' + s + '   (' + mol.atoms.length + ')')
  console.log('  ' + mol.atoms.map((a,i) => `${i}:${SYM[z(a)]||z(a)}${a.chg?(a.chg>0?'+':'-'):''}`).join(' '))
  m.delete()
}
