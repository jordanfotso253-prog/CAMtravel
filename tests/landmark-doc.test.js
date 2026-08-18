const assert = require('node:assert/strict');
const { findLandmarkDocumentary } = require('../js/landmark-doc.js');

const cases = [
  ['bonanjo', 'Pagode de Bonanjo'],
  ['monument reunification', 'Monument de la Réunification'],
  ['yaounde', 'Monument de la Réunification'],
  ['douala', 'Pagode de Bonanjo'],
  ['bafoussam', 'Palais royal de Foumban'],
  ['kribi', 'Chutes de la Lobé']
];

for (const [query, expectedTitle] of cases) {
  const doc = findLandmarkDocumentary(query);
  assert.ok(doc, `Aucune fiche documentaire pour: ${query}`);
  assert.equal(doc.title, expectedTitle, `Mauvais résultat pour: ${query}`);
}

console.log('landmark-doc tests: OK');
