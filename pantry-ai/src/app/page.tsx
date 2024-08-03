'use client';

import { useState, useEffect, useCallback } from 'react';
import { db } from './firebaseConfig';
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot } from 'firebase/firestore';

interface InventoryItem {
  id: string;
  item: string;
  quantity: number;
  msrp: number; // MSRP for one item
}

const Page = () => {
  const [item, setItem] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('');
  const [msrp, setMsrp] = useState<string>('');
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'inventory'), (snapshot) => {
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as InventoryItem[];
      setInventory(items);
    }, (error) => {
      console.error('Error fetching inventory: ', error);
      setError('Failed to fetch inventory.');
    });

    return () => unsubscribe();
  }, []);

  const handleAddItem = async () => {
    try {
      if (item.trim() === '' || quantity.trim() === '' || msrp.trim() === '') {
        setError('Item, quantity, and MSRP are required.');
        return;
      }

      await addDoc(collection(db, 'inventory'), {
        item,
        quantity: parseInt(quantity),
        msrp: parseFloat(msrp),
      });
      setItem('');
      setQuantity('');
      setMsrp('');
      setError(null);
    } catch (e) {
      console.error('Error adding document: ', e);
      setError('Failed to add item.');
    }
  };

  const handleUpdateItem = useCallback(async (id: string, updatedQuantity: number) => {
    try {
      const itemDoc = doc(db, 'inventory', id);
      const updatedItem = inventory.find(item => item.id === id);
      if (!updatedItem) return;

      await updateDoc(itemDoc, { quantity: updatedQuantity });
      setError(null);
    } catch (e) {
      console.error('Error updating document: ', e);
      setError('Failed to update item.');
    }
  }, [inventory]);

  const handleDeleteItem = useCallback(async (id: string) => {
    try {
      const itemDoc = doc(db, 'inventory', id);
      await deleteDoc(itemDoc);
      setError(null);
    } catch (e) {
      console.error('Error deleting document: ', e);
      setError('Failed to delete item.');
    }
  }, []);

  return (
    <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-4 min-h-screen bg-cover bg-center" style={{ backgroundImage: 'url(https://i.pinimg.com/originals/da/24/dd/da24dd4512e3ef96adc79fb3ad2849ab.gif)' }}>
      <div className="bg-white bg-opacity-75 p-8 rounded-lg shadow-lg h-full flex flex-col justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-4">Pantry Tracking System</h1>
          {error && <div className="text-red-500 mb-4">{error}</div>}
          <input
            type="text"
            placeholder="Item"
            className="w-full p-2 mb-4 border border-gray-300 rounded"
            value={item}
            onChange={(e) => setItem(e.target.value)}
          />
          <input
            type="number"
            placeholder="Quantity"
            className="w-full p-2 mb-4 border border-gray-300 rounded"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
          />
          <input
            type="number"
            placeholder="MSRP"
            className="w-full p-2 mb-4 border border-gray-300 rounded"
            value={msrp}
            onChange={(e) => setMsrp(e.target.value)}
          />
        </div>
        <button
          className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
          onClick={handleAddItem}
        >
          Add Item
        </button>
      </div>
      <div className="w-full px-8 overflow-auto h-full mt-4">
        <table className="min-w-full bg-white rounded-t-2xl">
          <thead>
            <tr>
              <th className="py-2 px-4 border-b">Item</th>
              <th className="py-2 px-4 border-b">Quantity</th>
              <th className="py-2 px-4 border-b">Total MSRP</th>
              <th className="py-2 px-4 border-b">Actions</th>
            </tr>
          </thead>
          <tbody>
            {inventory.map(item => (
              <tr key={item.id}>
                <td className="py-2 px-4 border-b text-center">{item.item}</td>
                <td className="py-2 px-4 border-b text-center">{item.quantity}</td>
                <td className="py-2 px-4 border-b text-center">${(item.msrp * item.quantity).toFixed(2)}</td>
                <td className="py-2 px-4 border-b flex space-x-2 justify-center">
                  <button onClick={() => handleUpdateItem(item.id, item.quantity + 1)} className="px-2 bg-green-500 text-white rounded hover:bg-green-600">
                    +
                  </button>
                  <button onClick={() => handleUpdateItem(item.id, item.quantity - 1)} className="px-2 bg-yellow-500 text-white rounded hover:bg-yellow-600">
                    -
                  </button>
                  <button onClick={() => handleDeleteItem(item.id)} className="px-1 bg-red-500 text-white rounded hover:bg-red-600">
                    🗑
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Page;
