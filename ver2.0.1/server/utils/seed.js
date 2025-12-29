import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Author from '../models/Author.js';
import Book from '../models/Book.js';

dotenv.config();

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    // Clear existing data
    await User.deleteMany({});
    await Author.deleteMany({});
    await Book.deleteMany({});

    console.log('🌱 Seeding database...');

    // Create sample users
    const users = await User.create([
  {
    username: 'admin',
    name: 'Admin User',
    email: 'admin@aurumreads.com',
    password: 'password123',
    role: 'admin',
    isVerified: true,
    favoriteGenres: ['Fiction', 'Science Fiction', 'Mystery'],
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin'
  },
  {
    username: 'john_reader',
    name: 'John Reader',
    email: 'john@example.com',
    password: 'password123',
    isVerified: true,
    favoriteGenres: ['Non-Fiction', 'Biography', 'History'],
    readingStats: {
      booksRead: 15,
      totalPagesRead: 4500,
      currentStreak: 7,
      longestStreak: 21
    },
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=john'
  }
]);

    // Create sample authors
    const authors = await Author.create([
      {
        name: 'J.K. Rowling',
        bio: 'British author best known for the Harry Potter series.',
        shortBio: 'Creator of the Wizarding World',
        photo: 'https://upload.wikimedia.org/wikipedia/commons/5/5d/J._K._Rowling_2010.jpg',
        nationality: 'British',
        genres: ['Fantasy', 'Fiction', 'Young Adult'],
        isVerified: true,
        followersCount: 1500000
      },
      {
        name: 'Yuval Noah Harari',
        bio: 'Israeli historian and professor at the Hebrew University of Jerusalem.',
        shortBio: 'Author of Sapiens and Homo Deus',
        photo: 'https://upload.wikimedia.org/wikipedia/commons/c/c8/Yuval_Noah_Harari_%28cropped%29.jpg',
        nationality: 'Israeli',
        genres: ['Non-Fiction', 'History', 'Science'],
        isVerified: true,
        followersCount: 850000
      }
    ]);

    // Create sample books
    const books = await Book.create([
      {
        title: 'Harry Potter and the Philosopher\'s Stone',
        author: authors[0]._id,
        description: 'The first novel in the Harry Potter series...',
        shortDescription: 'Join Harry Potter in his first year at Hogwarts.',
        coverImage: 'https://m.media-amazon.com/images/I/81YOuOGFCJL.jpg',
        genres: ['Fantasy', 'Fiction', 'Young Adult'],
        language: 'English',
        publishedDate: new Date('1997-06-26'),
        pageCount: 223,
        formats: [
          { type: 'ebook', price: 9.99, isAvailable: true },
          { type: 'hardcover', price: 24.99, isAvailable: true },
          { type: 'audiobook', price: 14.99, isAvailable: true }
        ],
        ratings: {
          average: 4.8,
          count: 12500,
          distribution: { 1: 50, 2: 100, 3: 500, 4: 2500, 5: 9350 }
        },
        bestseller: true,
        featured: true
      },
      {
        title: 'Sapiens: A Brief History of Humankind',
        author: authors[1]._id,
        description: 'Explores the history of humankind from the evolution...',
        shortDescription: 'A groundbreaking narrative of humanity\'s creation.',
        coverImage: 'https://m.media-amazon.com/images/I/713jIoMO3UL.jpg',
        genres: ['Non-Fiction', 'History', 'Science'],
        language: 'English',
        publishedDate: new Date('2011-01-01'),
        pageCount: 443,
        formats: [
          { type: 'ebook', price: 12.99, isAvailable: true },
          { type: 'paperback', price: 18.99, isAvailable: true },
          { type: 'audiobook', price: 16.99, isAvailable: true }
        ],
        ratings: {
          average: 4.6,
          count: 8900,
          distribution: { 1: 40, 2: 80, 3: 400, 4: 2000, 5: 6380 }
        },
        bestseller: true,
        newRelease: false
      }
    ]);

    console.log('✅ Database seeded successfully!');
    console.log(`📚 Created ${users.length} users, ${authors.length} authors, ${books.length} books`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
};

seedData();