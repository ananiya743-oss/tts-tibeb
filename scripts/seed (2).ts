// TT's Tibeb — Database seed
// Run with: bun run scripts/seed.ts
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const db = new PrismaClient()

async function main() {
  // --- Admin user ---
  const adminEmail = 'admin@ttstibeb.com'
  const adminPass = 'Admin123'
  const existing = await db.adminUser.findUnique({ where: { email: adminEmail } })
  if (!existing) {
    const passwordHash = await bcrypt.hash(adminPass, 10)
    await db.adminUser.create({
      data: { email: adminEmail, passwordHash, name: 'TT Admin', role: 'super_admin' }
    })
    console.log(`Created admin: ${adminEmail} / ${adminPass}`)
  } else {
    console.log('Admin already exists')
  }

  // --- Categories ---
  const categories = [
    { name: 'Habesha Kemis', slug: 'habesha-kemis', description: 'Traditional Ethiopian women\'s dresses handwoven with delicate tibeb borders.', image: 'https://images.unsplash.com/photo-1583846552345-d27a35e2a5b2?auto=format&fit=crop&w=900&q=80' },
    { name: 'Netela', slug: 'netela', description: 'Lightweight cotton shawls with intricately embroidered borders.', image: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=900&q=80' },
    { name: 'Kuta & Gabi', slug: 'kuta-gabi', description: 'Traditional men\'s wraps and blankets woven from pure Ethiopian cotton.', image: 'https://images.unsplash.com/photo-1606293459339-aaa5b6b7d85c?auto=format&fit=crop&w=900&q=80' },
    { name: 'Wedding Collection', slug: 'wedding', description: 'Ceremonial pieces for the most important day — opulent tibeb, gold thread, and silks.', image: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=900&q=80' },
    { name: 'Accessories', slug: 'accessories', description: 'Jewelry, headpieces, and accents that complete the Habesha look.', image: 'https://images.unsplash.com/photo-1535632787350-4e68ef0ac584?auto=format&fit=crop&w=900&q=80' }
  ]
  for (const c of categories) {
    await db.category.upsert({
      where: { slug: c.slug },
      update: c,
      create: c
    })
  }
  console.log(`Seeded ${categories.length} categories`)

  // --- Products ---
  const products = [
    {
      title: 'Yebelo Premium White Habesha Kemis',
      slug: 'yebelo-premium-white-kemis',
      description: 'A timeless white Habesha Kemis with a handwoven tibeb border in deep gold and crimson. Worn for centuries by Ethiopian women for church, weddings, and family celebrations, this piece carries the soul of the highlands in every thread.',
      fabricInfo: '100% hand-spun Ethiopian cotton. Tibeb border woven with rayon and metallic gold thread.',
      careInfo: 'Hand wash cold or dry clean. Do not bleach. Iron on low heat on the reverse side.',
      price: 320.00, salePrice: 280.00,
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1583846552345-d27a35e2a5b2?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1583846552647-1ca0d6e9c0b3?auto=format&fit=crop&w=1200&q=80'
      ]),
      sizes: JSON.stringify(['XS', 'S', 'M', 'L', 'XL']),
      category: 'habesha-kemis',
      inStock: true, stockCount: 12, featured: true, rating: 4.9, reviewCount: 23
    },
    {
      title: 'Addis Gold-Threaded Wedding Kemis',
      slug: 'addis-gold-wedding-kemis',
      description: 'A statement bridal Kemis in ivory with an opulent gold-threaded tibeb. Each thread is woven by master artisans in Addis Ababa, creating a garment fit for a queen on her wedding day.',
      fabricInfo: 'Premium Ethiopian cotton body. Tibeb of metallic gold thread and silk accents.',
      careInfo: 'Dry clean only. Store in a breathable garment bag away from direct sunlight.',
      price: 720.00,
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1595777216632-6c1c1b2e2c2e?auto=format&fit=crop&w=1200&q=80'
      ]),
      sizes: JSON.stringify(['S', 'M', 'L', 'XL']),
      category: 'wedding',
      inStock: true, stockCount: 5, featured: true, rating: 5.0, reviewCount: 11
    },
    {
      title: 'Gondar Crimson Netela',
      slug: 'gondar-crimson-netela',
      description: 'A flowing cotton netela with a vivid crimson and gold tibeb at both ends. Worn over the shoulders for church services, holidays, and cool highland evenings.',
      fabricInfo: 'Pure handwoven Ethiopian cotton. Tibeb of rayon and metallic gold.',
      careInfo: 'Hand wash cold with mild detergent. Hang dry in shade.',
      price: 95.00, salePrice: 79.00,
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1606293459339-aaa5b6b7d85c?auto=format&fit=crop&w=1200&q=80'
      ]),
      sizes: JSON.stringify(['One Size']),
      category: 'netela',
      inStock: true, stockCount: 40, featured: false, rating: 4.8, reviewCount: 17
    },
    {
      title: 'Lalibela Men\'s Kuta Set',
      slug: 'lalibela-mens-kuta-set',
      description: 'A dignified men\'s kuta set in cream with a deep gold tibeb. Tailored for ceremony — church, wedding, and important family gatherings.',
      fabricInfo: '100% Ethiopian cotton. Hand-embroidered gold-thread borders.',
      careInfo: 'Dry clean recommended. May be hand washed cold and line dried.',
      price: 240.00,
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1606293459339-aaa5b6b7d85c?auto=format&fit=crop&w=1200&q=80'
      ]),
      sizes: JSON.stringify(['S', 'M', 'L', 'XL', 'XXL']),
      category: 'kuta-gabi',
      inStock: true, stockCount: 8, featured: true, rating: 4.7, reviewCount: 9
    },
    {
      title: 'Aksum Royal Embroidered Kemis',
      slug: 'aksum-royal-embroidered-kemis',
      description: 'A deep emerald and gold Kemis with full-body embroidery inspired by Aksumite obelisk motifs. A bold, modern interpretation of ancient geometry.',
      fabricInfo: 'Premium cotton-silk blend. Embroidered tibeb with metallic gold thread.',
      careInfo: 'Dry clean only.',
      price: 480.00,
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1583846552647-1ca0d6e9c0b3?auto=format&fit=crop&w=1200&q=80'
      ]),
      sizes: JSON.stringify(['XS', 'S', 'M', 'L']),
      category: 'habesha-kemis',
      inStock: true, stockCount: 6, featured: true, rating: 4.9, reviewCount: 14
    },
    {
      title: 'Tigray Heritage Gabi Wrap',
      slug: 'tigray-heritage-gabi-wrap',
      description: 'A heavy, plush gabi wrap in natural cotton — woven in four layers for warmth during the highland cold season. A treasured heirloom piece.',
      fabricInfo: 'Pure hand-spun Ethiopian cotton, four-layer weave.',
      careInfo: 'Hand wash cold. Hang dry. Do not twist.',
      price: 180.00,
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1606293459339-aaa5b6b7d85c?auto=format&fit=crop&w=1200&q=80'
      ]),
      sizes: JSON.stringify(['One Size']),
      category: 'kuta-gabi',
      inStock: false, stockCount: 0, featured: false, rating: 4.6, reviewCount: 4
    },
    {
      title: 'Habesha Gold Cross Necklace',
      slug: 'habesha-gold-cross-necklace',
      description: 'A traditional Ethiopian Orthodox cross pendant in matte gold, hand-finished by Addis Ababa silversmiths. Comes with a delicate 18-inch chain.',
      fabricInfo: 'Brass base with 18k gold plating. Hypoallergenic.',
      careInfo: 'Keep dry. Store in pouch. Avoid contact with perfumes.',
      price: 65.00,
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1535632787350-4e68ef0ac584?auto=format&fit=crop&w=1200&q=80'
      ]),
      sizes: JSON.stringify(['One Size']),
      category: 'accessories',
      inStock: true, stockCount: 50, featured: true, rating: 4.8, reviewCount: 31
    },
    {
      title: 'Shewa Modern Cut Kemis',
      slug: 'shewa-modern-cut-kemis',
      description: 'A modern silhouette with a fitted bodice and high-low hem, finished with a delicate gold tibeb. Made for the contemporary Habesha woman.',
      fabricInfo: 'Crisp cotton poplin. Gold-threaded tibeb trim.',
      careInfo: 'Machine wash cold gentle. Hang dry. Iron medium heat.',
      price: 210.00, salePrice: 175.00,
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1583846552345-d27a35e2a5b2?auto=format&fit=crop&w=1200&q=80'
      ]),
      sizes: JSON.stringify(['XS', 'S', 'M', 'L', 'XL']),
      category: 'habesha-kemis',
      inStock: true, stockCount: 18, featured: false, rating: 4.7, reviewCount: 12
    }
  ]
  for (const p of products) {
    await db.product.upsert({
      where: { slug: p.slug },
      update: p,
      create: p
    })
  }
  console.log(`Seeded ${products.length} products`)

  // --- Hero Banner (3 slideshow slides) ---
  const heroCount = await db.heroBanner.count()
  if (heroCount === 0) {
    const slides = [
      {
        headline: 'Woven Heritage. Modern Elegance.',
        subtitle: 'Authentic Habesha traditional wear — handwoven in Ethiopia, treasured at home.',
        imageUrl: 'https://images.unsplash.com/photo-1583846552345-d27a35e2a5b2?auto=format&fit=crop&w=1920&q=80',
        ctaText: 'Explore Collection',
        ctaLink: '#shop',
        active: true
      },
      {
        headline: 'Bridal Couture. Woven in Gold.',
        subtitle: 'Statement wedding pieces — each thread woven by master artisans in Addis Ababa.',
        imageUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1920&q=80',
        ctaText: 'Discover Wedding Edit',
        ctaLink: '#shop',
        active: true
      },
      {
        headline: 'The Tibeb Tradition. Reimagined.',
        subtitle: 'From ceremonial classics to modern silhouettes — heritage craftsmanship for every occasion.',
        imageUrl: 'https://images.unsplash.com/photo-1583846552647-1ca0d6e9c0b3?auto=format&fit=crop&w=1920&q=80',
        ctaText: 'Shop New Arrivals',
        ctaLink: '#shop',
        active: true
      }
    ]
    for (const s of slides) {
      await db.heroBanner.create({ data: s })
    }
  }

  // --- Announcement ---
  const annCount = await db.announcement.count()
  if (annCount === 0) {
    await db.announcement.create({
      data: {
        message: 'Handwoven in Addis Ababa — delivered nationwide across Ethiopia.',
        active: true
      }
    })
  }

  // --- Site content defaults ---
  const defaults: Record<string, string> = {
    'about.title': 'Our Story',
    'about.body': 'TT\'s Tibeb was founded to honor the ancient art of Ethiopian weaving and to share it with the world. Each piece is handwoven by master artisans in Addis Ababa and across the highlands — preserving techniques passed down for generations. We believe that heritage is not a museum piece but a living, breathing craft that deserves a place in modern wardrobes. Every thread tells a story of family, faith, and the enduring beauty of Habesha culture.',
    'about.image': 'https://images.unsplash.com/photo-1583846552647-1ca0d6e9c0b3?auto=format&fit=crop&w=1200&q=80',
    'footer.address': 'Bole Road, Addis Ababa, Ethiopia',
    'footer.phone': '+251 911 234 567',
    'footer.email': 'hello@ttstibeb.com',
    'footer.instagram': 'https://instagram.com/ttstibeb',
    'footer.facebook': 'https://facebook.com/ttstibeb',
    'footer.tiktok': 'https://tiktok.com/@ttstibeb',
    'footer.copyright': 'TT\'s Tibeb. Crafted with heritage in Addis Ababa.',
    'nav.menu': JSON.stringify([
      { label: 'Home', href: '#home' },
      { label: 'Shop', href: '#shop' },
      { label: 'Categories', href: '#categories' },
      { label: 'About', href: '#about' },
      { label: 'Contact', href: '#contact' }
    ])
  }
  for (const [key, value] of Object.entries(defaults)) {
    await db.siteContent.upsert({
      where: { id: key },
      update: {},
      create: { id: key, value }
    })
  }

  console.log('Seed complete.')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => db.$disconnect())
