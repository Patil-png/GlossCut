import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';
import { ArrowLeft } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const EditTagScreen = ({ navigation, route }) => {
  const { theme } = useTheme();
  const { currentTag, onSave } = route.params;
  const [tag, setTag] = useState(currentTag || '');

  const handleSave = async () => {
    if (!tag.trim()) {
      Alert.alert('Error', 'Tag cannot be empty.');
      return;
    }
    try {
      const token = await AsyncStorage.getItem('token');
      await axios.put(`${process.env.EXPO_PUBLIC_API_URL}/api/shop/tag`, { tag }, { headers: { 'x-auth-token': token } });
      onSave(tag); // Call the onSave callback to update the parent screen's state
      navigation.goBack();
    } catch (err) {
      console.error("Failed to update tag", err);
      Alert.alert('Error', 'Failed to update tag. Please try again.');
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    backButton: {
      marginRight: 15,
      padding: 5,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.colors.text,
    },
    content: {
      flex: 1,
      padding: 20,
    },
    label: {
      fontSize: 16,
      color: theme.colors.textSecondary,
      marginBottom: 8,
    },
    input: {
      backgroundColor: theme.colors.card,
      borderRadius: 10,
      paddingHorizontal: 15,
      paddingVertical: 12,
      fontSize: 16,
      color: theme.colors.text,
      borderWidth: 1,
      borderColor: theme.colors.border,
      marginBottom: 20,
    },
    saveButton: {
      backgroundColor: theme.colors.primary,
      borderRadius: 10,
      paddingVertical: 15,
      alignItems: 'center',
    },
    saveButtonText: {
      color: theme.colors.onPrimary,
      fontSize: 18,
      fontWeight: 'bold',
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Tag</Text>
      </View>
      <View style={styles.content}>
        <Text style={styles.label}>Shop Tag</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter a tag for your shop"
          placeholderTextColor={theme.colors.textSecondary}
          value={tag}
          onChangeText={setTag}
          autoCapitalize="words"
        />
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Save Tag</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default EditTagScreen;
