import React, { createContext, useContext, useMemo, useState, useEffect } from "react";
import { supabase, isSupabaseConfigured } from "../lib/supabase";

const ClientsContext = createContext(null);

export const ClientsProvider = ({ children }) => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [supabaseEnabled, setSupabaseEnabled] = useState(false);

  // Check if Supabase is configured
  useEffect(() => {
    const configured = isSupabaseConfigured();
    setSupabaseEnabled(configured);
    if (!configured) {
      console.log('ℹ️ Supabase not configured for clients, using local storage');
    } else {
      console.log('✅ Supabase configured for clients');
    }
  }, []);

  // Load clients from Supabase on mount
  useEffect(() => {
    if (supabaseEnabled) {
      loadClients();
    } else {
      setLoading(false);
    }
  }, [supabaseEnabled]);

  // Load clients from Supabase
  const loadClients = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: supabaseError } = await supabase
        .from('clients')
        .select('id, name, phone, created_at')
        .order('name', { ascending: true });

      if (supabaseError) {
        throw supabaseError;
      }

      setClients(data || []);
    } catch (err) {
      console.error('Error loading clients from Supabase:', err);
      setError(err.message || 'Failed to load clients');
      setClients([]);
    } finally {
      setLoading(false);
    }
  };

  // Add a new client
  const addClient = async (clientData) => {
    const { name, phone } = clientData;

    if (!name || !name.trim()) {
      throw new Error('Client name is required');
    }

    // Optimistically add to local state
    const tempClient = {
      id: `temp-${Date.now()}`,
      name: name.trim(),
      phone: phone || '',
      created_at: new Date().toISOString(),
    };
    setClients((prev) => [...prev, tempClient]);

    // If Supabase is enabled, save to database
    if (supabaseEnabled) {
      try {
        const { data, error: supabaseError } = await supabase
          .from('clients')
          .insert({
            name: name.trim(),
            phone: phone || '',
          })
          .select('id, name, phone, created_at')
          .single();

        if (supabaseError) {
          throw supabaseError;
        }

        // Replace optimistic update with actual data
        setClients((prev) =>
          prev.map((client) => (client.id === tempClient.id ? data : client))
        );

        return data;
      } catch (err) {
        console.error('Error saving client to Supabase:', err);
        setError(err.message || 'Failed to save client');
        // Remove optimistic update on error
        setClients((prev) => prev.filter((client) => client.id !== tempClient.id));
        throw err;
      }
    } else {
      // Return the temp client if Supabase not enabled
      return tempClient;
    }
  };

  // Update an existing client
  const updateClient = async (clientId, clientData) => {
    const { name, phone } = clientData;

    if (!name || !name.trim()) {
      throw new Error('Client name is required');
    }

    // Optimistically update local state
    setClients((prev) =>
      prev.map((client) =>
        client.id === clientId
          ? { ...client, name: name.trim(), phone: phone || '' }
          : client
      )
    );

    // If Supabase is enabled, update in database
    if (supabaseEnabled) {
      try {
        const { data, error: supabaseError } = await supabase
          .from('clients')
          .update({
            name: name.trim(),
            phone: phone || '',
          })
          .eq('id', clientId)
          .select('id, name, phone, created_at')
          .single();

        if (supabaseError) {
          throw supabaseError;
        }

        // Replace optimistic update with actual data
        setClients((prev) =>
          prev.map((client) => (client.id === clientId ? data : client))
        );

        return data;
      } catch (err) {
        console.error('Error updating client in Supabase:', err);
        setError(err.message || 'Failed to update client');
        // Reload clients to revert optimistic update
        loadClients();
        throw err;
      }
    }
  };

  // Delete a client
  const deleteClient = async (clientId) => {
    // Optimistically remove from local state
    const clientToDelete = clients.find((c) => c.id === clientId);
    setClients((prev) => prev.filter((client) => client.id !== clientId));

    // If Supabase is enabled, delete from database
    if (supabaseEnabled) {
      try {
        const { error: supabaseError } = await supabase
          .from('clients')
          .delete()
          .eq('id', clientId);

        if (supabaseError) {
          throw supabaseError;
        }
      } catch (err) {
        console.error('Error deleting client from Supabase:', err);
        setError(err.message || 'Failed to delete client');
        // Restore client on error
        if (clientToDelete) {
          setClients((prev) => [...prev, clientToDelete]);
        }
        throw err;
      }
    }
  };

  // Get client by ID
  const getClientById = (clientId) => {
    return clients.find((client) => client.id === clientId);
  };

  // Get client by name
  const getClientByName = (name) => {
    return clients.find((client) => client.name.toLowerCase() === name.toLowerCase().trim());
  };

  const value = useMemo(
    () => ({
      clients,
      addClient,
      updateClient,
      deleteClient,
      getClientById,
      getClientByName,
      loading,
      error,
      supabaseEnabled,
      refreshClients: loadClients,
    }),
    [clients, loading, error, supabaseEnabled]
  );

  return (
    <ClientsContext.Provider value={value}>
      {children}
    </ClientsContext.Provider>
  );
};

export const useClients = () => {
  const ctx = useContext(ClientsContext);
  if (!ctx) throw new Error("useClients must be used within ClientsProvider");
  return ctx;
};

