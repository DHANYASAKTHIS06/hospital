import { Request, Response } from 'express';
import { MenuItem } from '../models/MenuItem';
import { getNextSequenceValue } from '../models/Counter';

export const getMenuItems = async (req: Request, res: Response) => {
  try {
    const items = await MenuItem.find().sort({ menu_id: 1 });
    
    // Day calculation
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const currentDay = days[new Date().getDay()];

    const itemsWithDayAvailability = items.map((item) => {
      const isAvailableOnDay = item.available_days.includes(currentDay);
      return {
        ...item.toObject(),
        is_available_today: item.availability && isAvailableOnDay,
        current_day: currentDay,
      };
    });

    return res.status(200).json(itemsWithDayAvailability);
  } catch (error: any) {
    console.error('Get Menu Error:', error);
    return res.status(500).json({ message: 'Error retrieving menu items.' });
  }
};

export const addMenuItem = async (req: Request, res: Response) => {
  try {
    const {
      item_name,
      category,
      description,
      quantity,
      price,
      availability,
      available_days,
      requires_serving_time,
      serving_time_slots,
    } = req.body;

    if (!item_name || !category || !quantity || price === undefined) {
      return res.status(400).json({ message: 'Item name, category, quantity, and price are required.' });
    }

    if (price <= 0) {
      return res.status(400).json({ message: 'Price must be greater than 0.' });
    }

    const menu_id = await getNextSequenceValue('menu_id');
    const isServingTimeReq = requires_serving_time !== undefined
      ? Boolean(requires_serving_time)
      : (category === 'TEA / MILK');

    const defaultSlots = ['7:00 AM', '11:00 AM', '4:00 PM', '7:00 PM'];
    const slots = Array.isArray(serving_time_slots) && serving_time_slots.length > 0
      ? serving_time_slots
      : defaultSlots;

    const newItem = await MenuItem.create({
      menu_id,
      item_name,
      category,
      description: description || '',
      quantity,
      price: Number(price),
      availability: availability !== undefined ? availability : true,
      available_days: available_days || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      requires_serving_time: isServingTimeReq,
      serving_time_slots: slots,
    });

    return res.status(201).json({
      message: 'Menu item added successfully',
      item: newItem,
    });
  } catch (error: any) {
    console.error('Add Menu Item Error:', error);
    return res.status(500).json({ message: 'Error adding menu item.' });
  }
};

export const updateMenuItem = async (req: Request, res: Response) => {
  try {
    const { menuId } = req.params;
    const {
      item_name,
      category,
      description,
      quantity,
      price,
      availability,
      available_days,
      requires_serving_time,
      serving_time_slots,
    } = req.body;

    const item = await MenuItem.findOne({ menu_id: Number(menuId) });
    if (!item) {
      return res.status(404).json({ message: 'Menu item not found.' });
    }

    if (price !== undefined && Number(price) <= 0) {
      return res.status(400).json({ message: 'Price must be greater than 0.' });
    }

    if (item_name) item.item_name = item_name;
    if (category) item.category = category;
    if (description !== undefined) item.description = description;
    if (quantity) item.quantity = quantity;
    if (price !== undefined) item.price = Number(price);
    if (availability !== undefined) item.availability = availability;
    if (available_days) item.available_days = available_days;
    if (requires_serving_time !== undefined) item.requires_serving_time = Boolean(requires_serving_time);
    if (serving_time_slots !== undefined && Array.isArray(serving_time_slots)) {
      item.serving_time_slots = serving_time_slots;
    }

    await item.save();

    return res.status(200).json({
      message: 'Menu item updated successfully',
      item,
    });
  } catch (error: any) {
    console.error('Update Menu Item Error:', error);
    return res.status(500).json({ message: 'Error updating menu item.' });
  }
};

export const deleteMenuItem = async (req: Request, res: Response) => {
  try {
    const { menuId } = req.params;
    const deleted = await MenuItem.findOneAndDelete({ menu_id: Number(menuId) });

    if (!deleted) {
      return res.status(404).json({ message: 'Menu item not found.' });
    }

    return res.status(200).json({ message: 'Menu item deleted successfully' });
  } catch (error: any) {
    console.error('Delete Menu Item Error:', error);
    return res.status(500).json({ message: 'Error deleting menu item.' });
  }
};
