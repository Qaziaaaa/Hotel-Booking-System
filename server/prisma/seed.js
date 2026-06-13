import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding...');

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123456', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@hotelbooking.com' },
    update: { password: adminPassword },
    create: {
      email: 'admin@hotelbooking.com',
      password: adminPassword,
      firstName: 'Admin',
      lastName: 'User',
      phone: '+1234567890',
      role: 'ADMIN',
    },
  });
  console.log('Admin user ready:', admin.email);

  // Create sample user
  const userPassword = await bcrypt.hash('password123', 12);
  const user = await prisma.user.upsert({
    where: { email: 'user@example.com' },
    update: { password: userPassword },
    create: {
      email: 'user@example.com',
      password: userPassword,
      firstName: 'John',
      lastName: 'Doe',
      phone: '+1987654321',
      role: 'USER',
    },
  });
  console.log('Sample user ready:', user.email);

  // Create sample hotels
  const hotels = [
    {
      name: 'Grand Plaza Hotel',
      location: 'New York, USA',
      address: '123 Broadway, New York, NY 10001',
      description: 'Experience luxury in the heart of Manhattan. The Grand Plaza Hotel offers stunning views of the city skyline, world-class amenities, and impeccable service. Located just steps from Times Square and Central Park.',
      amenities: ['wifi', 'pool', 'gym', 'parking', 'breakfast', 'spa', 'bar', 'restaurant'],
      images: [
        'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800',
        'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=800',
        'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=800',
      ],
      rating: 4.5,
      rooms: [
        {
          roomType: 'Standard Room',
          price: 199,
          capacity: 2,
          amenities: ['wifi', 'tv', 'ac', 'minibar'],
          description: 'Comfortable room with city view, queen bed, and modern amenities.',
          images: ['https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=800'],
        },
        {
          roomType: 'Deluxe Suite',
          price: 399,
          capacity: 3,
          amenities: ['wifi', 'tv', 'ac', 'minibar', 'jacuzzi', 'balcony'],
          description: 'Spacious suite with king bed, separate living area, and stunning city views.',
          images: ['https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800'],
        },
        {
          roomType: 'Presidential Suite',
          price: 899,
          capacity: 4,
          amenities: ['wifi', 'tv', 'ac', 'minibar', 'jacuzzi', 'balcony', 'kitchen', 'butler'],
          description: 'Ultimate luxury with panoramic views, private terrace, and personalized service.',
          images: ['https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&w=800'],
        },
      ],
    },
    {
      name: 'Seaside Resort & Spa',
      location: 'Miami, USA',
      address: '456 Ocean Drive, Miami Beach, FL 33139',
      description: 'Escape to paradise at our beachfront resort. Enjoy pristine beaches, oceanfront dining, and rejuvenating spa treatments. Perfect for romantic getaways and family vacations.',
      amenities: ['wifi', 'pool', 'beach', 'spa', 'parking', 'breakfast', 'bar', 'restaurant', 'kids-club'],
      images: [
        'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800',
        'https://images.unsplash.com/photo-1540541338287-4175174cc67d?auto=format&fit=crop&w=800',
        'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?auto=format&fit=crop&w=800',
      ],
      rating: 4.7,
      rooms: [
        {
          roomType: 'Ocean View Room',
          price: 289,
          capacity: 2,
          amenities: ['wifi', 'tv', 'ac', 'balcony', 'ocean-view'],
          description: 'Wake up to stunning ocean views from your private balcony.',
          images: ['https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=800'],
        },
        {
          roomType: 'Beachfront Villa',
          price: 599,
          capacity: 4,
          amenities: ['wifi', 'tv', 'ac', 'kitchen', 'private-pool', 'beach-access', 'bbq'],
          description: 'Private villa with direct beach access and your own plunge pool.',
          images: ['https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?auto=format&fit=crop&w=800'],
        },
      ],
    },
    {
      name: 'Mountain Lodge Retreat',
      location: 'Aspen, USA',
      address: '789 Mountain Road, Aspen, CO 81611',
      description: 'Experience rustic luxury in the Colorado Rockies. Our mountain lodge offers cozy fireplaces, ski-in/ski-out access, and breathtaking mountain views.',
      amenities: ['wifi', 'parking', 'breakfast', 'fireplace', 'ski-storage', 'hot-tub', 'gym'],
      images: [
        'https://images.unsplash.com/photo-1518732714860-b62714ce0c59?auto=format&fit=crop&w=800',
        'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800',
        'https://images.unsplash.com/photo-1445019980597-93fa8acb226c?auto=format&fit=crop&w=800',
      ],
      rating: 4.6,
      rooms: [
        {
          roomType: 'Cozy Cabin',
          price: 249,
          capacity: 2,
          amenities: ['wifi', 'tv', 'fireplace', 'kitchenette'],
          description: 'Intimate cabin with wood-burning fireplace and forest views.',
          images: ['https://images.unsplash.com/photo-1449156493391-d2cfa28e468b?auto=format&fit=crop&w=800'],
        },
        {
          roomType: 'Mountain Suite',
          price: 449,
          capacity: 4,
          amenities: ['wifi', 'tv', 'fireplace', 'kitchen', 'hot-tub', 'balcony'],
          description: 'Spacious suite with private hot tub and panoramic mountain views.',
          images: ['https://images.unsplash.com/photo-1602002418082-a4443e081dd1?auto=format&fit=crop&w=800'],
        },
      ],
    },
    {
      name: 'Historic Downtown Inn',
      location: 'Boston, USA',
      address: '321 Beacon Street, Boston, MA 02116',
      description: 'Step back in time at our charming historic inn. Located in the heart of Boston, featuring antique furnishings, modern comforts, and easy access to historic sites.',
      amenities: ['wifi', 'breakfast', 'parking', 'garden', 'library'],
      images: [
        'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=800',
        'https://images.unsplash.com/photo-1522771753035-a0a1f66cd459?auto=format&fit=crop&w=800',
        'https://images.unsplash.com/photo-1496417263034-38ec4f085b8d?auto=format&fit=crop&w=800',
      ],
      rating: 4.3,
      rooms: [
        {
          roomType: 'Classic Room',
          price: 179,
          capacity: 2,
          amenities: ['wifi', 'tv', 'ac', 'heritage-furniture'],
          description: 'Elegant room with period furnishings and modern bathroom.',
          images: ['https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=800'],
        },
        {
          roomType: 'Heritage Suite',
          price: 329,
          capacity: 3,
          amenities: ['wifi', 'tv', 'ac', 'fireplace', 'sitting-area', 'garden-view'],
          description: 'Spacious suite with original fireplace and garden views.',
          images: ['https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800'],
        },
      ],
    },
  ];

  for (const hotelData of hotels) {
    const { rooms, ...hotelInfo } = hotelData;

    // Check if hotel already exists to make seed idempotent
    const existing = await prisma.hotel.findFirst({ where: { name: hotelInfo.name } });
    if (existing) {
      console.log('Hotel already exists, skipping:', hotelInfo.name);
      continue;
    }

    const hotel = await prisma.hotel.create({ data: hotelInfo });
    console.log('Created hotel:', hotel.name);

    for (const roomData of rooms) {
      const room = await prisma.room.create({
        data: {
          ...roomData,
          hotelId: hotel.id,
        },
      });
      console.log('Created room:', room.roomType, 'for', hotel.name);
    }
  }

  console.log('Seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
