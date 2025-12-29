import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const InfoModal = ({ visible, onClose, title, content }) => {
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close-circle-outline" size={28} color="#6c757d" />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalBody}>
            {typeof content === 'string' ? (
              <Text style={styles.modalText}>{content}</Text>
            ) : (
              // Assuming content is an array of sections for compliance guidelines
              content?.sections?.map((section, index) => (
                <View key={index} style={styles.sectionContainer}>
                  <Text style={styles.sectionHeading}>{section.heading}</Text>
                  <Text style={styles.sectionContent}>{section.content}</Text>
                </View>
              ))
            )}
            {content?.disclaimer && (
              <Text style={styles.disclaimerText}>{content.disclaimer}</Text>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)', // Dim background
  },
  modalView: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: '90%', // Take up most of the screen width
    maxHeight: '80%', // Limit height
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#333333',
    flex: 1, // Allow title to take available space
  },
  closeButton: {
    padding: 5,
  },
  modalBody: {
    width: '100%',
  },
  modalText: {
    marginBottom: 15,
    textAlign: 'left',
    fontSize: 16,
    color: '#6c757d',
    lineHeight: 24,
  },
  sectionContainer: {
    marginBottom: 15,
  },
  sectionHeading: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 5,
  },
  sectionContent: {
    fontSize: 15,
    color: '#6c757d',
    lineHeight: 22,
  },
  disclaimerText: {
    fontSize: 13,
    color: '#dc3545', // Danger color for disclaimer
    fontStyle: 'italic',
    marginTop: 10,
    textAlign: 'center',
  },
});

export default InfoModal;
