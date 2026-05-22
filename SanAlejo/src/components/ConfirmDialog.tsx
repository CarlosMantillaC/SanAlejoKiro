import React from 'react';
import { Modal, View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radii, Shadows, Spacing, Typography } from '../theme';

interface ConfirmDialogProps {
  visible: boolean;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({ visible, message, onConfirm, onCancel }: ConfirmDialogProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <Pressable style={styles.overlay} onPress={onCancel}>
        <Pressable style={styles.card} onPress={() => {}}>
          {/* Icon */}
          <View style={styles.iconWrap}>
            <Ionicons name="warning-outline" size={28} color={Colors.danger} />
          </View>

          <Text style={styles.message}>{message}</Text>
          <Text style={styles.subtext}>Esta acción no se puede deshacer.</Text>

          <View style={styles.buttonRow}>
            <Pressable
              style={({ pressed }) => [styles.cancelBtn, pressed && styles.cancelBtnPressed]}
              onPress={onCancel}
              accessibilityRole="button"
              accessibilityLabel="Cancelar"
            >
              <Text style={styles.cancelText}>Cancelar</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.deleteBtn, pressed && styles.deleteBtnPressed]}
              onPress={onConfirm}
              accessibilityRole="button"
              accessibilityLabel="Eliminar"
            >
              <Text style={styles.deleteText}>Eliminar</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xxxl,
  },
  card: {
    backgroundColor: Colors.bgElevated,
    borderRadius: Radii.xl,
    padding: Spacing.xxl,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    ...Shadows.md,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.dangerMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  message: {
    fontSize: Typography.md,
    fontWeight: Typography.semibold,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  subtext: {
    fontSize: Typography.sm,
    color: Colors.textMuted,
    textAlign: 'center',
    marginBottom: Spacing.xxl,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    width: '100%',
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.bgMuted,
    alignItems: 'center',
  },
  cancelBtnPressed: {
    backgroundColor: Colors.bgMuted,
  },
  cancelText: {
    fontSize: Typography.base,
    color: Colors.textSecondary,
    fontWeight: Typography.medium,
  },
  deleteBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: Radii.md,
    backgroundColor: Colors.danger,
    alignItems: 'center',
  },
  deleteBtnPressed: {
    backgroundColor: Colors.dangerDark,
  },
  deleteText: {
    fontSize: Typography.base,
    color: Colors.textOnDanger,
    fontWeight: Typography.semibold,
  },
});
