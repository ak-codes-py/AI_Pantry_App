'use client';

import { useState, useEffect, useCallback } from 'react';
import { db } from './firebaseConfig';
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, where, getDocs } from 'firebase/firestore';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Pagination from '@mui/material/Pagination';
import { styled } from '@mui/material/styles';

interface InventoryItem {
  id: string;
  item: string;
  quantity: number;
  msrp: number; // MSRP for one item
}

const SearchContainer = styled('div')({
  marginTop: '20px',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
});

const Page = () => {
  const [item, setItem] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('');
  const [msrp, setMsrp] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 5;

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'inventory'), (snapshot) => {
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as InventoryItem[];
      setInventory(items);
      setError(null);
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
      if (!updatedItem) {
        setError('Item not found.');
        return;
      }

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

  const handleSearch = async () => {
    try {
      const q = query(collection(db, 'inventory'), where('item', '==', searchTerm));
      const querySnapshot = await getDocs(q);
      const searchResults = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as InventoryItem[];
      setInventory(searchResults);
      setError(null);
    } catch (e) {
      console.error('Error searching inventory: ', e);
      setError('Failed to search inventory.');
    }
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = inventory.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(inventory.length / itemsPerPage);

  return (
    <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-4 min-h-screen" style={{ backgroundImage:'url(https://images.pexels.com/photos/1103970/pexels-photo-1103970.jpeg?cs=srgb&dl=pexels-jplenio-1103970.jpg&fm=jpg)' }}>
      <div className="relative bg-opacity-75 p-8 rounded-lg shadow-lg h-full flex flex-col justify-between">
      <div className="relative z-10">
          <h1 className="text-2xl font-bold mb-4 font-merriweather-light font-light" style={{ color: '#333' }}>Pantry Tracking System</h1>
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
          className="relative z-10 w-full p-2 rounded hover:bg-opacity-90"
          onClick={handleAddItem}
          style={{ backgroundColor: '#254E70', color: 'white' }}
        >
          Add Item
        </button>
        <div className="absolute inset-0 bg-white bg-opacity-50 rounded-lg z-0"></div>
      </div>
      <div className="w-full px-8 overflow-auto h-full">
        <SearchContainer>
          <TextField
            label="Search Item"
            variant="outlined"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ marginRight: '10px', width: '300px' }}
          />
          <Button variant="contained" onClick={handleSearch} style={{ backgroundColor: '#37718E', color: 'white' }}>
            Search
          </Button>
        </SearchContainer>
        <table className="min-w-full bg-white rounded-t-2xl bg-opacity-75 mt-4">
          <thead>
            <tr style={{ backgroundColor: '#37718E', color: 'white' }}>
              <th className="py-2 px-4 border-b font-playfair">Item</th>
              <th className="py-2 px-4 border-b font-playfair">Quantity</th>
              <th className="py-2 px-4 border-b font-playfair">Total MSRP</th>
              <th className="py-2 px-4 border-b font-playfair">Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.map(item => (
              <tr key={item.id}>
                <td className="py-2 px-4 border-b text-center" style={{ color: '#254E70' }}>{item.item}</td>
                <td className="py-2 px-4 border-b text-center" style={{ color: '#254E70' }}>{item.quantity}</td>
                <td className="py-2 px-4 border-b text-center" style={{ color: '#254E70' }}>${(item.msrp * item.quantity).toFixed(2)}</td>
                <td className="py-2 px-4 border-b flex space-x-2 justify-center">
                  <button onClick={() => handleUpdateItem(item.id, item.quantity + 1)} className="px-2 rounded hover:bg-opacity-90" style={{ backgroundColor: '#8EE3EF', color: '#254E70' }}>
                    +
                  </button>
                  <button onClick={() => handleUpdateItem(item.id, item.quantity - 1)} className="px-2 rounded hover:bg-opacity-90" style={{ backgroundColor: '#8EE3EF', color: '#254E70' }}>
                    -
                  </button>
                  <button onClick={() => handleDeleteItem(item.id)} className="px-1 rounded hover:bg-opacity-90" style={{ backgroundColor: '#c33c54', color: 'white' }}>
                    🗑
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <Pagination
          count={totalPages}
          page={currentPage}
          onChange={(event, value) => setCurrentPage(value)}
          sx={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}
        />
      </div>
    </div>
  );
};

export default Page;
