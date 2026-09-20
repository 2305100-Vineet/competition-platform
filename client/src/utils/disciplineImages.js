// Small pools of stock photos per discipline. A card picks one deterministically
// from its own _id (not randomly), so the same tournament/team always shows the
// same photo across reloads, while different tournaments of the same sport get
// visibly different photos.

const POOLS = {
  cricket: [
    'https://images.unsplash.com/photo-1512719994953-eabf50895df7',
    'https://images.unsplash.com/photo-1593341646782-e0b495cff86d',
    'https://images.unsplash.com/photo-1599982946086-eb42d9e14eb8',
    'https://images.unsplash.com/photo-1644984785609-676ed703333e',
    'https://images.unsplash.com/photo-1624194697120-34347cff8b58'
  ],
  football: [
    'https://images.unsplash.com/photo-1508087625439-de3978963553',
    'https://images.unsplash.com/photo-1574629810360-7efbbe195018',
    'https://images.unsplash.com/photo-1560272564-c83b66b1ad12',
    'https://images.unsplash.com/photo-1606925797300-0b35e9d1794e',
    'https://images.unsplash.com/photo-1598399615261-adafbbb044fc'
  ],
  pubg: [
    'https://images.unsplash.com/photo-1542751371-adc38448a05e',
    'https://images.unsplash.com/photo-1534423861386-85a16f5d13fd',
    'https://images.unsplash.com/photo-1548686304-5c3be888a00b',
    'https://images.unsplash.com/photo-1636487658582-96efd1693bcb',
    'https://images.unsplash.com/photo-1580234811497-9df7fd2f357e'
  ]
};

function hashId(id) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  return hash;
}

export function getDisciplineImage(discipline, id, params = 'auto=format&fit=crop&w=200&q=80') {
  const pool = POOLS[discipline];
  if (!pool || !id) return null;
  const index = hashId(id) % pool.length;
  return `${pool[index]}?${params}`;
}