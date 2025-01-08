// src/components/DataTable.tsx
'use client';
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from './ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

const queryClient = new QueryClient();

const fetchData = async ({ queryKey }: any) => {
  const [, { page, pageSize, search, ageFilter, cityFilter }] = queryKey;
  const response = await fetch(`http://localhost:5000/api/data?page=${page}&pageSize=${pageSize}&search=${search}&ageFilter=${ageFilter}&cityFilter=${cityFilter}`);
  if (!response.ok) {
    throw new Error('Network response was not ok');
  }
  return response.json();
};

const DataTable: React.FC = () => {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(2);
  const [search, setSearch] = useState('');
  const [ageFilter, setAgeFilter] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [editingItem, setEditingItem] = useState<any>(null); // State to hold the item being edited
  const queryClient = useQueryClient();

  const { data, error, isLoading } = useQuery({
    queryKey: ['data', { page, pageSize, search, ageFilter, cityFilter }],
    queryFn: fetchData,
    keepPreviousData: true,
  });

  const schema = z.object({
    name: z.string().min(1, 'Name is required'),
    age: z.preprocess(val => Number(val), z.number().min(1, 'Age must be a positive number')),
    city: z.string().min(1, 'City is required'),
  });

  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    resolver: zodResolver(schema),
  });

  const mutationAdd = useMutation({
    mutationFn: async (newItem: any) => {
      const response = await fetch('http://localhost:5000/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newItem),
      });
      if (!response.ok) {
        throw new Error('Failed to add item');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['data']);
      reset();
    },
  });

  const mutationDelete = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`http://localhost:5000/api/data/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete item');
      }
      return id;
    },
    onSuccess: (id) => {
      queryClient.invalidateQueries(['data']);
    },
  });

  const mutationUpdate = useMutation({
    mutationFn: async (updatedItem: any) => {
      const response = await fetch(`http://localhost:5000/api/data/${updatedItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedItem),
      });
      if (!response.ok) {
        throw new Error('Failed to update item');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['data']);
      setEditingItem(null); // Clear the edit mode after update
      reset();
    },
  });

  const onSubmit = (formData: any) => {
    if (editingItem) {
      // If editingItem is set, it means we're in edit mode
      mutationUpdate.mutate({ ...formData, id: editingItem.id, age: Number(formData.age) });
    } else {
      mutationAdd.mutate({ ...formData, age: Number(formData.age) });
    }
  };

  const onDelete = (id: number) => {
    mutationDelete.mutate(id);
  };

  const onEdit = (item: any) => {
    setEditingItem(item);
    reset(item); 
  };

  const onCancelEdit = () => {
    setEditingItem(null); 
    reset(); 
  };

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error fetching data</div>;

  return (
    <div className="p-4">
      <form onSubmit={handleSubmit(onSubmit)} className="mb-4">
        <input {...register('name')} placeholder="Name" className="p-2 border rounded mr-2" />
        {errors.name && <span>{errors.name.message}</span>}
        <input {...register('age')} type="number" placeholder="Age" className="p-2 border rounded mr-2" />
        {errors.age && <span>{errors.age.message}</span>}
        <input {...register('city')} placeholder="City" className="p-2 border rounded mr-2" />
        {errors.city && <span>{errors.city.message}</span>}
        <button type="submit" className="p-2 bg-blue-500 text-white rounded">
          {editingItem ? 'Update' : 'Add'}
        </button>
        {editingItem && (
          <button type="button" onClick={onCancelEdit} className="p-2 bg-gray-500 text-white rounded ml-2">
            Cancel
          </button>
        )}
      </form>

      <div className="filters mb-4">
        <input
          type="text"
          placeholder="Search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="p-2 border rounded mr-2"
        />
        <input
          type="number"
          placeholder="Age Filter"
          value={ageFilter}
          onChange={(e) => setAgeFilter(e.target.value)}
          className="p-2 border rounded mr-2"
        />
        <input
          type="text"
          placeholder="City Filter"
          value={cityFilter}
          onChange={(e) => setCityFilter(e.target.value)}
          className="p-2 border rounded mr-2"
        />
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Age</TableHead>
            <TableHead>City</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data?.data.map((item: any) => (
            <TableRow key={item.id}>
              <TableCell>{item.id}</TableCell>
              <TableCell>{item.name}</TableCell>
              <TableCell>{item.age}</TableCell>
              <TableCell>{item.city}</TableCell>
              <TableCell>
                <Button variant="outline" onClick={() => onEdit(item)}>Edit</Button>
                &nbsp;
               
                <Button variant="outline" onClick={() => onDelete(item.id)}>Delete</Button>
                
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>


      <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline">Show Dialog</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete your
            account and remove your data from our servers.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction>Continue</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
     

      <div className="flex justify-between items-center mt-4">
        <button onClick={() => setPage((old) => Math.max(old - 1, 1))} disabled={page === 1}>Previous</button>
        <span>Page {page}</span>
        <button
          onClick={() => setPage((old) => (!data || data.data.length < pageSize ? old : old + 1))}
          disabled={data && data.data.length < pageSize}
        >
          Next
        </button>
      </div>
    </div>
  );
};

const App: React.FC = () => (
  <QueryClientProvider client={queryClient}>
    <DataTable />
  </QueryClientProvider>
);

export default App;
