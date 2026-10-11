import React from 'react';
import { Redirect } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import LoadingView from '../components/LoadingView';

export default function IndexScreen() {
  const { user, loading } = useAuth();

  if (loading) return <LoadingView />;

  return <Redirect href={user ? '/(tabs)' : '/login'} />;
}