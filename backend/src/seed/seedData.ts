import bcrypt from 'bcryptjs';
import { Admin } from '../models/Admin';
import { MenuItem } from '../models/MenuItem';
import { Counter } from '../models/Counter';

export const seedDatabase = async () => {
  try {
    // 1. Seed Admin User
    const existingAdmin = await Admin.findOne({ username: 'admin' });
    if (!existingAdmin) {
      const password_hash = await bcrypt.hash('Admin@123', 10);
      await Admin.create({
        username: 'admin',
        password_hash,
      });
      console.log('Seeded Admin account: admin / Admin@123');
    }

    // 2. Seed Initial Menu Items
    const count = await MenuItem.countDocuments();
    if (count === 0) {
      const allDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

      const initialItems = [
        // TEA / MILK
        {
          menu_id: 1,
          item_name: 'Tea / Milk',
          category: 'TEA / MILK',
          quantity: '100 ml',
          price: 20,
          availability: true,
          available_days: allDays,
        },
        {
          menu_id: 2,
          item_name: 'Coffee / Boost / Horlicks',
          category: 'TEA / MILK',
          quantity: '100 ml',
          price: 25,
          availability: true,
          available_days: allDays,
        },

        // BREAKFAST
        {
          menu_id: 3,
          item_name: 'Idly',
          category: 'BREAKFAST',
          quantity: '2 Nos',
          price: 25,
          availability: true,
          available_days: allDays,
        },
        {
          menu_id: 4,
          item_name: 'Dosa',
          category: 'BREAKFAST',
          quantity: '2 Nos',
          price: 40,
          availability: true,
          available_days: allDays,
        },
        {
          menu_id: 5,
          item_name: 'Uppma (Wheat)',
          category: 'BREAKFAST',
          quantity: '300 gms',
          price: 50,
          availability: true,
          available_days: allDays,
        },
        {
          menu_id: 6,
          item_name: 'Kichadi',
          category: 'BREAKFAST',
          quantity: '300 gms',
          price: 40,
          availability: true,
          available_days: allDays,
        },
        {
          menu_id: 7,
          item_name: 'Pongal (Millet)',
          category: 'BREAKFAST',
          quantity: '300 gms',
          price: 50,
          availability: true,
          available_days: allDays,
        },
        {
          menu_id: 8,
          item_name: 'Pongal (Rice)',
          category: 'BREAKFAST',
          quantity: '300 gms',
          price: 40,
          availability: true,
          available_days: allDays,
        },
        {
          menu_id: 9,
          item_name: 'Sevai Lemon/Tomato',
          category: 'BREAKFAST',
          quantity: '300 gms',
          price: 30,
          availability: true,
          available_days: allDays,
        },
        {
          menu_id: 10,
          item_name: 'Special Rice Porridge',
          category: 'BREAKFAST',
          quantity: '200 ml',
          price: 20,
          availability: true,
          available_days: allDays,
        },

        // LUNCH
        {
          menu_id: 11,
          item_name: 'Meals',
          category: 'LUNCH',
          description: 'Rice - 350 gms, Sambar - 100 ml, Rasam - 100 ml, Curd - 50 ml, Poriyal - 100 gms',
          quantity: '1 portion',
          price: 80,
          availability: true,
          available_days: allDays,
        },
        {
          menu_id: 12,
          item_name: 'Variety Rice (Lemon/Curd/Tomato)',
          category: 'LUNCH',
          description: '300 gms + Poriyal 100 gms',
          quantity: '300 gms',
          price: 50,
          availability: true,
          available_days: allDays,
        },
        {
          menu_id: 13,
          item_name: 'Omlet',
          category: 'LUNCH',
          quantity: '1 No',
          price: 20,
          availability: true,
          available_days: allDays,
        },
        {
          menu_id: 14,
          item_name: 'Boiled Egg',
          category: 'LUNCH',
          quantity: '2 Nos',
          price: 25,
          availability: true,
          available_days: allDays,
        },
        {
          menu_id: 15,
          item_name: 'Extra Poriyal (Vegetable)',
          category: 'LUNCH',
          quantity: '100 gms',
          price: 20,
          availability: true,
          available_days: allDays,
        },

        // DINNER
        {
          menu_id: 16,
          item_name: 'Chappathi',
          category: 'DINNER',
          quantity: '2 Nos',
          price: 40,
          availability: true,
          available_days: allDays,
        },
        {
          menu_id: 17,
          item_name: 'Uthappam',
          category: 'DINNER',
          quantity: '2 Nos',
          price: 50,
          availability: true,
          available_days: allDays,
        },
        {
          menu_id: 18,
          item_name: 'Adai Dosa',
          category: 'DINNER',
          quantity: '2 Nos',
          price: 50,
          availability: true,
          available_days: allDays,
        },
        {
          menu_id: 19,
          item_name: 'Appam',
          category: 'DINNER',
          quantity: '2 Nos',
          price: 40,
          availability: true,
          available_days: allDays,
        },
        {
          menu_id: 20,
          item_name: 'Dosa',
          category: 'DINNER',
          quantity: '2 Nos',
          price: 40,
          availability: true,
          available_days: allDays,
        },
        {
          menu_id: 21,
          item_name: 'Podi/Onion Dosa',
          category: 'DINNER',
          quantity: '1 No',
          price: 35,
          availability: true,
          available_days: allDays,
        },
        {
          menu_id: 22,
          item_name: 'Idly',
          category: 'DINNER',
          quantity: '2 Nos',
          price: 25,
          availability: true,
          available_days: allDays,
        },
        {
          menu_id: 23,
          item_name: 'Arisi Parupu Sadam',
          category: 'DINNER',
          quantity: '300 gms',
          price: 50,
          availability: true,
          available_days: allDays,
        },
        {
          menu_id: 24,
          item_name: 'Poori',
          category: 'DINNER',
          quantity: '2 Nos',
          price: 40,
          availability: true,
          available_days: ['Sunday'], // Sunday Only by default
        },
        {
          menu_id: 25,
          item_name: 'Mushroom Biriyani',
          category: 'DINNER',
          quantity: '1 portion',
          price: 70,
          availability: true,
          available_days: allDays,
        },
        {
          menu_id: 26,
          item_name: 'Millet Curd Rice',
          category: 'DINNER',
          quantity: '1 portion',
          price: 50,
          availability: true,
          available_days: allDays,
        },

        // SNACKS
        {
          menu_id: 27,
          item_name: 'Soup',
          category: 'SNACKS',
          quantity: '200 ml',
          price: 30,
          availability: true,
          available_days: allDays,
        },
        {
          menu_id: 28,
          item_name: 'Sundal',
          category: 'SNACKS',
          quantity: '100 gms',
          price: 20,
          availability: true,
          available_days: allDays,
        },
      ];

      await MenuItem.insertMany(initialItems);
      await Counter.findByIdAndUpdate(
        'menu_id',
        { seq: 28 },
        { upsert: true }
      );
      console.log('Seeded initial menu items successfully.');
    }
  } catch (error) {
    console.error('Error seeding database:', error);
  }
};
