(function(global){
  const landmarkDocuments = [
    {
      title: 'Pagode de Bonanjo',
      region: 'Littoral',
      city: 'Douala',
      description: 'La pagode de Bonanjo est un site emblématique de Douala, connu pour son architecture inspirée des traditions spirituelles et son importance culturelle dans la métropole économique du Cameroun.',
      highlights: ['Patrimoine culturel', 'Architecture symbolique', 'Douala'],
      keywords: ['bonanjo', 'pagode', 'douala', 'littoral', 'bon cote', 'bonanjo pagode'],
      image: 'https://commons.wikimedia.org/wiki/Special:FilePath/La%20pagode%20bonanjo%2003.jpg'
    },
    {
      title: 'Monument de la Réunification',
      region: 'Centre',
      city: 'Yaoundé',
      description: 'Le Monument de la Réunification est une attraction historique de Yaoundé, célébrant l’histoire politique et nationale du Cameroun à travers un espace emblématique de mémoire et de cohésion.',
      highlights: ['Histoire nationale', 'Symbole de paix', 'Yaoundé'],
      keywords: ['monument de la reunification', 'reunification', 'yaounde', 'centre', 'monument', 'réunification'],
      image: 'https://upload.wikimedia.org/wikipedia/commons/4/48/Monument_Reunification_4.JPG'
    },
    {
      title: 'Palais royal de Foumban',
      region: 'Ouest',
      city: 'Foumban',
      description: 'Le palais royal de Foumban témoigne de l’histoire des peuples bamiléké et de la richesse du patrimoine culturel de l’Ouest camerounais.',
      highlights: ['Culture bamoun', 'Patrimoine vivant', 'Foumban'],
      keywords: ['palais royal', 'foumban', 'bafoussam', 'ouest', 'royaume'],
      image: 'https://upload.wikimedia.org/wikipedia/commons/b/bd/Palais_royal_de_FOUMBAN.jpg'
    },
    {
      title: 'Chutes de la Lobé',
      region: 'Sud',
      city: 'Kribi',
      description: 'Les chutes de la Lobé sont un joyau naturel du Sud, où l’eau se jette dans l’océan et offre un paysage spectaculaire et touristique.',
      highlights: ['Nature spectaculaire', 'Kribi', 'Tourisme côtier'],
      keywords: ['chutes de la lobe', 'lobe', 'kribi', 'sud', 'chutes'],
      image: 'https://commons.wikimedia.org/wiki/Special:FilePath/Chutes%20de%20la%20Lob%C3%A9.jpg'
    },
    {
      title: 'Mont Cameroun',
      region: 'Sud-Ouest',
      city: 'Buea',
      description: 'Le Mont Cameroun est un site majestueux du Sud-Ouest, prisé pour ses paysages, ses randonnées et son lien fort avec l’histoire et la culture locale.',
      highlights: ['Randonnée', 'Paysages', 'Buea'],
      keywords: ['mont cameroun', 'buea', 'sud ouest', 'sud-ouest', 'montagne'],
      image: 'https://commons.wikimedia.org/wiki/Special:FilePath/Mount%20Cameroon.jpg'
    },
    {
      title: 'Monts Mandara',
      region: 'Extrême-Nord',
      city: 'Mokolo',
      description: 'Les monts Mandara offrent un panorama exceptionnel au Nord du pays, avec des reliefs majestueux et une culture très riche à découvrir.',
      highlights: ['Reliefs', 'Culture', 'Mokolo'],
      keywords: ['monts mandara', 'mandara', 'mokolo', 'extreme nord', 'extrême-nord'],
      image: 'https://upload.wikimedia.org/wikipedia/commons/1/1e/ASC_Leiden_-_W.E.A._van_Beek_Collection_-_Thuis_in_Afrika_-_01.1_-_A_hazy_day_in_Kapsiki_country_with_the_Mandara_Mountains_-_Mogod%C3%A9%2C_Cameroon_-_2008.jpg'
    }
  ];

  function normalizeText(value) {
    return String(value || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function findLandmarkDocumentary(query) {
    const normalizedQuery = normalizeText(query);
    if (!normalizedQuery) return null;

    for (const item of landmarkDocuments) {
      const haystack = item.keywords.map(normalizeText).join(' ');
      if (normalizedQuery.includes(haystack) || item.keywords.some(keyword => normalizedQuery.includes(normalizeText(keyword)))) {
        return item;
      }
    }

    const regionKeywords = ['region', 'région', 'monument', 'culture', 'tourisme', 'decouverte'];
    if (regionKeywords.some(keyword => normalizedQuery.includes(normalizeText(keyword)))) {
      return landmarkDocuments[0];
    }

    return null;
  }

  const api = { landmarkDocuments, findLandmarkDocumentary };
  global.landmarkDoc = api;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(typeof window !== 'undefined' ? window : globalThis);
