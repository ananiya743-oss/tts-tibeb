// One-time update of existing announcement + hero to remove "worldwide" framing
import { PrismaClient } from '@prisma/client'
const db = new PrismaClient()

async function main() {
  // Deactivate existing announcements, then create a fresh one
  await db.announcement.updateMany({ where: { active: true }, data: { active: false } })
  await db.announcement.create({
    data: {
      message: 'Handwoven in Addis Ababa — delivered nationwide across Ethiopia.',
      active: true
    }
  })

  // Update existing hero banner subtitle (deactivate any active, create new)
  await db.heroBanner.updateMany({ where: { active: true }, data: { active: false } })
  await db.heroBanner.create({
    data: {
      headline: 'Woven Heritage. Modern Elegance.',
      subtitle: 'Authentic Habesha traditional wear — handwoven in Ethiopia, treasured at home.',
      imageUrl: 'https://images.unsplash.com/photo-1583846552345-d27a35e2a5b2?auto=format&fit=crop&w=1920&q=80',
      ctaText: 'Explore Collection',
      ctaLink: '#shop',
      active: true
    }
  })

  console.log('Updated announcement + hero to Ethiopia-focused messaging.')
}

main().finally(() => db.$disconnect())
