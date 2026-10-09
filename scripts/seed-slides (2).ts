// One-time script: ensure 3 sample slideshow slides exist in the database
import { PrismaClient } from '@prisma/client'
const db = new PrismaClient()

async function main() {
  // Reset: delete all existing slides and create 3 fresh sample slides
  await db.heroBanner.deleteMany({})

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

  console.log(`Seeded ${slides.length} sample slideshow slides.`)
}

main().finally(() => db.$disconnect())
