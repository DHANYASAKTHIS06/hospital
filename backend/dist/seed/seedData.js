"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedDatabase = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const Admin_1 = require("../models/Admin");
const MenuItem_1 = require("../models/MenuItem");
const Counter_1 = require("../models/Counter");
const seedDatabase = async () => {
    try {
        // 1. Seed Admin User
        const existingAdmin = await Admin_1.Admin.findOne({ username: 'admin' });
        if (!existingAdmin) {
            const password_hash = await bcryptjs_1.default.hash('ProCare@2026', 10);
            await Admin_1.Admin.create({
                username: 'admin',
                password_hash,
            });
            console.log('Seeded Admin account: admin / ProCare@2026');
        }
        // 2. Seed Initial Menu Items
        const count = await MenuItem_1.MenuItem.countDocuments();
        if (count === 0) {
            const allDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
            const initialItems = [
                // TEA / MILK
                {
                    menu_id: 1,
                    item_name: 'Tea',
                    category: 'TEA / MILK',
                    quantity: '100 ml',
                    price: 20,
                    availability: true,
                    available_days: allDays,
                    requires_serving_time: true,
                    serving_time_slots: ['7:00 AM', '11:00 AM', '4:00 PM', '7:00 PM'],
                },
                {
                    menu_id: 2,
                    item_name: 'Coffee',
                    category: 'TEA / MILK',
                    quantity: '100 ml',
                    price: 25,
                    availability: true,
                    available_days: allDays,
                    requires_serving_time: true,
                    serving_time_slots: ['7:00 AM', '11:00 AM', '4:00 PM', '7:00 PM'],
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
                    category: 'COMMON MENU',
                    quantity: '1 No',
                    price: 20,
                    availability: true,
                    available_days: allDays,
                },
                {
                    menu_id: 14,
                    item_name: 'Boiled Egg',
                    category: 'COMMON MENU',
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
            await MenuItem_1.MenuItem.insertMany(initialItems);
            await Counter_1.Counter.findByIdAndUpdate('menu_id', { seq: 28 }, { upsert: true });
            console.log('Seeded initial menu items successfully.');
        }
        // Ensure common menu items in existing database are assigned category 'COMMON MENU'
        await MenuItem_1.MenuItem.updateMany({ item_name: { $in: ['Omlet', 'Omelet', 'Boiled Egg'] } }, { $set: { category: 'COMMON MENU' } });
        const standardSlots = ['7:00 AM', '11:00 AM', '4:00 PM', '7:00 PM'];
        // Update existing Tea record (avoiding duplicates)
        await MenuItem_1.MenuItem.updateOne({
            $or: [
                { item_name: { $regex: /^Tea(\s*\/\s*Milk)?$/i } },
                { menu_id: 1 },
            ],
        }, {
            $set: {
                item_name: 'Tea',
                category: 'TEA / MILK',
                requires_serving_time: true,
                serving_time_slots: standardSlots,
            },
        });
        // Update existing Coffee record (avoiding duplicates)
        await MenuItem_1.MenuItem.updateOne({
            $or: [
                { item_name: { $regex: /^Coffee(\s*\/.*)?$/i } },
                { menu_id: 2 },
            ],
        }, {
            $set: {
                item_name: 'Coffee',
                category: 'TEA / MILK',
                requires_serving_time: true,
                serving_time_slots: standardSlots,
            },
        });
        // Ensure Milk exists as its own record without duplicates
        const existingMilk = await MenuItem_1.MenuItem.findOne({
            $or: [
                { item_name: { $regex: /^Milk$/i } },
                { item_name: 'Milk' },
            ],
        });
        if (!existingMilk) {
            const highestItem = await MenuItem_1.MenuItem.findOne().sort({ menu_id: -1 });
            const nextId = (highestItem?.menu_id || 28) + 1;
            const allDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
            await MenuItem_1.MenuItem.create({
                menu_id: nextId,
                item_name: 'Milk',
                category: 'TEA / MILK',
                quantity: '100 ml',
                price: 20,
                availability: true,
                available_days: allDays,
                requires_serving_time: true,
                serving_time_slots: standardSlots,
            });
            await Counter_1.Counter.findByIdAndUpdate('menu_id', { seq: nextId }, { upsert: true });
            console.log('Created distinct Milk menu item with serving time slots.');
        }
        else {
            existingMilk.category = 'TEA / MILK';
            existingMilk.requires_serving_time = true;
            existingMilk.serving_time_slots = standardSlots;
            await existingMilk.save();
        }
        // Ensure all TEA / MILK items in the database have requires_serving_time and standardSlots
        await MenuItem_1.MenuItem.updateMany({ category: 'TEA / MILK' }, {
            $set: {
                requires_serving_time: true,
                serving_time_slots: standardSlots,
            },
        });
    }
    catch (error) {
        console.error('Error seeding database:', error);
    }
};
exports.seedDatabase = seedDatabase;
