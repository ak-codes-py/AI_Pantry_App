'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { db } from './firebaseConfig';
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, where, getDocs } from 'firebase/firestore';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Pagination from '@mui/material/Pagination';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import { styled } from '@mui/material/styles';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import { Camera } from 'react-camera-pro';
import * as tf from '@tensorflow/tfjs';
import * as mobilenet from '@tensorflow-models/mobilenet';
import 'react-html5-camera-photo/build/css/index.css';

interface InventoryItem {
  id: string;
  item: string;
  quantity: number;
  weight: number;
  weightUnit: string;
  dateAdded: string;
  photoUrl?: string;
  classification?: string;
}

const weightUnits = ['kg', 'pound', 'litre', 'milliliter', 'gram', 'tablespoon', 'serving size'];

const SearchContainer = styled('div')({
  marginTop: '20px',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
});

const Page = () => {
  const [item, setItem] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('');
  const [weight, setWeight] = useState<string>('');
  const [weightUnit, setWeightUnit] = useState<string>(weightUnits[0]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 5;
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchResults, setSearchResults] = useState<InventoryItem[]>([]);
  const [isCameraOpen, setIsCameraOpen] = useState<boolean>(false);
  const [photo, setPhoto] = useState<string | null>(null);
  const [classification, setClassification] = useState<string | null>(null);
  const camera = useRef<any>(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'pantry'), (snapshot) => {
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as InventoryItem[];
      setInventory(items.sort((a, b) => b.id.localeCompare(a.id)));
      setError(null);
    }, (error) => {
      console.error('Error fetching inventory: ', error);
      setError('Failed to fetch inventory.');
    });

    return () => unsubscribe();
  }, []);

  const handleAddItem = async () => {
    try {
      if (item.trim() === '' || quantity.trim() === '' || weight.trim() === '' || weightUnit.trim() === '') {
        setError('Item, quantity, weight, and weight unit are required.');
        return;
      }

      const dateAdded = new Date().toLocaleDateString();

      const newItem = {
        item,
        quantity: parseInt(quantity),
        weight: parseFloat(weight),
        weightUnit,
        dateAdded,
        photoUrl: photo,
        classification: classification || 'Unknown', // Store classification result
      };

      await addDoc(collection(db, 'pantry'), newItem);
      setItem('');
      setQuantity('');
      setWeight('');
      setWeightUnit(weightUnits[0]);
      setPhoto(null);
      setClassification(null);
      setError(null);
    } catch (e) {
      console.error('Error adding document: ', e);
      setError('Failed to add item.');
    }
  };

  const handleUpdateItem = useCallback(async (id: string, updatedQuantity: number) => {
    try {
      const itemDoc = doc(db, 'pantry', id);
      const updatedItem = inventory.find(item => item.id === id);
      if (!updatedItem) {
        setError('Item not found.');
        return;
      }

      await updateDoc(itemDoc, { quantity: updatedQuantity });
      setInventory(prevInventory =>
        prevInventory.map(item =>
          item.id === id ? { ...item, quantity: updatedQuantity, photoUrl: photo ?? item.photoUrl, classification: classification || item.classification } : item
        )
      );
      if (isSearching) {
        setSearchResults(prevResults =>
          prevResults.map(item =>
            item.id === id ? { ...item, quantity: updatedQuantity, photoUrl: photo ?? item.photoUrl, classification: classification || item.classification } : item
          )
        );
      }
      setError(null);
    } catch (e) {
      console.error('Error updating document: ', e);
      setError('Failed to update item.');
    }
  }, [inventory, isSearching, photo, classification]);

  const handleDeleteItem = useCallback(async (id: string) => {
    try {
      const itemDoc = doc(db, 'pantry', id);
      await deleteDoc(itemDoc);
      if (isSearching) {
        setSearchResults(prevResults => prevResults.filter(item => item.id !== id));
      } else {
        setInventory(prevInventory => prevInventory.filter(item => item.id !== id));
      }
      setError(null);
    } catch (e) {
      console.error('Error deleting document: ', e);
      setError('Failed to delete item.');
    }
  }, [isSearching]);

  const handleSearch = async () => {
    setIsSearching(true);
    try {
      const q = query(collection(db, 'pantry'), where('item', '==', searchTerm));
      const querySnapshot = await getDocs(q);
      const searchResults = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as InventoryItem[];
      setSearchResults(searchResults);
      setError(null);
    } catch (e) {
      console.error('Error searching inventory: ', e);
      setError('Failed to search inventory.');
    }
  };

  const handleResetSearch = () => {
    setIsSearching(false);
    setSearchTerm('');
  };

  const [isLoading, setIsLoading] = useState(false);

  const handleTakePhoto = async () => {
    if (camera.current && 'takePhoto' in camera.current) {
      const dataUri = camera.current.takePhoto();
      setIsLoading(true);
      setPhoto(dataUri);
      setIsCameraOpen(false);
  
      try {
        const img = new Image();
        img.src = dataUri;
              img.onload = async () => {
                const model = await mobilenet.load();
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                if (!ctx) throw new Error('Failed to get 2D context');
  
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);
  
                // Create a tensor from the canvas and cast it to Tensor3D
                const tensor = tf.browser.fromPixels(canvas)
                  .resizeNearestNeighbor([224, 224])
                  .toFloat()
                  .expandDims() as tf.Tensor3D;
  
                // Classify the image using the model
                const predictions = await model.classify(tensor);
                if (predictions && predictions.length > 0) {
                  setClassification(predictions[0].className);
                  setItem(predictions[0].className);
                } else {
                  setClassification('Unknown');
                  setItem('Unknown');
                }
  
                // Dispose the tensor to release memory
                tensor.dispose();
              };      } catch (error) {
        console.error('Error processing image:', error);
        setError('Failed to process image.');
      } finally {
        setIsLoading(false);
      }
    }
  };
  


  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = isSearching ? searchResults.slice(indexOfFirstItem, indexOfLastItem) : inventory.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil((isSearching ? searchResults.length : inventory.length) / itemsPerPage);

  return (
    <div className="p-4 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-4 min-h-screen bg-cover" style={{ backgroundImage:'url(https://images.pexels.com/photos/1103970/pexels-photo-1103970.jpeg?cs=srgb&dl=pexels-jplenio-1103970.jpg&fm=jpg)' }}>
      <div className="relative bg-opacity-75 p-4 rounded-lg shadow-lg h-full flex flex-col justify-between">
        <form className="relative z-10">
          <div className="flex flex-col md:flex-row items-center justify-between mb-4">
            <div className="flex items-center mb-4 md:mb-0">
              <h1 className="text-xl md:text-2xl font-bold font-space-grotesk font-light" style={{ color: '#333' }}>Pantry_AI</h1>
              <img src="https://i.pinimg.com/originals/68/8e/9e/688e9eb45c2f5cc82361d5c305ccc0ca.gif" alt="Pantry AI Logo" className="ml-2 w-8 h-8 md:w-10 md:h-10 rounded-full"/>
            </div>
            <SearchContainer>
              <TextField
                label="Search Item"
                variant="outlined"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                sx={{ marginRight: '10px', width: { xs: '200px', md: '300px' } }}
              />
              <Button variant="contained" onClick={handleSearch} style={{ backgroundColor: '#37718E', color: 'white' }}>
                Search
              </Button>
              {isSearching && (
                <Button variant="outlined" onClick={handleResetSearch} sx={{ marginLeft: '10px' }}>
                  Reset
                </Button>
              )}
            </SearchContainer>
          </div>
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
          <div className="flex items-center space-x-2 mb-4">
            <input
              type="number"
              placeholder="Weight"
              className="w-full p-2 border border-gray-300 rounded"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
            />
            <Select
              value={weightUnit}
              onChange={(e) => setWeightUnit(e.target.value as string)}
              className="border border-gray-300 rounded"
            >
              {weightUnits.map(unit => (
                <MenuItem key={unit} value={unit}>{unit}</MenuItem>
              ))}
            </Select>
          </div>
          <div className="flex flex-col md:flex-row justify-center space-y-4 md:space-y-0 md:space-x-4">
            <Button
              variant="contained"
              onClick={handleAddItem}
              style={{ backgroundColor: '#254E70', color: 'white' }}
              className="relative z-10 p-2 rounded-3xl hover:bg-opacity-90"
            >
              Add Item
            </Button>
            <Button
              variant="contained"
              onClick={() => setIsCameraOpen(true)}
              style={{ backgroundColor: '#37718E', color: 'white' }}
              className="relative z-10 p-2 rounded hover:bg-opacity-90 px-6 flex items-center justify-center"
            >
              <CameraAltIcon className="mr-2" />
              Take Photo
            </Button>
          </div>
          {isCameraOpen && (
            <div className="mt-4 flex flex-col items-center">
              <Camera
                ref={camera}
                aspectRatio={16 / 9}
                errorMessages={{
                  noCameraAccessible: 'No camera device accessible',
                  permissionDenied: 'Permission denied',
                  switchCamera: 'Switch camera',
                  canvas: 'Canvas',
                }}
              />
              <div className="mt-4 flex space-x-4">
                <Button
                  variant="contained"
                  onClick={handleTakePhoto}
                  style={{ backgroundColor: '#8EE3EF', color: '#254E70' }}
                >
                  Take Photo
                </Button>
                <Button
                  variant="contained"
                  onClick={() => setIsCameraOpen(false)}
                  style={{ backgroundColor: '#c33c54', color: 'white' }}
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </form>
        <div className="absolute inset-0 bg-white bg-opacity-50 rounded-lg z-0"></div>
      </div>
      <div className="w-full px-4 md:px-8 overflow-auto h-full">
        <table className="min-w-full bg-white rounded-t-2xl bg-opacity-75 p-4 shadow-3d">
          <thead>
            <tr style={{ backgroundColor: '#37718E', color: 'white' }}>
              <th className="py-2 px-4 border-b">Item</th>
              <th className="py-2 px-4 border-b">Quantity</th>
              <th className="py-2 px-4 border-b">Total Weight</th>
              <th className="py-2 px-4 border-b">Unit</th>
              <th className="py-2 px-4 border-b">Date Added</th>
              <th className="py-2 px-4 border-b">Actions</th>
            </tr>
          </thead>
          <tbody className='font-space-grotesk'>
            {currentItems.map(item => (
              <tr key={item.id}>
                <td className="py-2 px-4 border-b text-center" style={{ color: '#254E70' }}>{item.item}</td>
                <td className="py-2 px-4 border-b text-center" style={{ color: '#254E70' }}>{item.quantity}</td>
                <td className="py-2 px-4 border-b text-center" style={{ color: '#254E70' }}>{(item.weight * item.quantity).toFixed(2)}</td>
                <td className="py-2 px-4 border-b text-center" style={{ color: '#254E70' }}>{item.weightUnit}</td>
                <td className="py-2 px-4 border-b text-center" style={{ color: '#254E70' }}>{item.dateAdded}</td>
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
