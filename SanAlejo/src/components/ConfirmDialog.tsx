import React from 'react';
import { Modal, View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Radii, Shadows, Spacing, Typography } from '../theme';
import { useTheme } from '../context/ThemeContext';

interface ConfirmDialogProps {
  visible: boolean;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({ visible, message, onConfirm, onCancel }: ConfirmDialogProps) {
  const { colors } = useTheme();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <Pressable
        style={[styles.overlay, { backgroundColor: colors.overlay }]}
        onPress={onCancel}
      >
        <Pressable
          style={[
            styles.card,
            { backgroundColor: colors.bgElevated, borderColor: colors.borderSubtle },
          ]}
          onPress={() => {}}
        >
          {/* Icon */}
          <View style={[styles.iconWrap, { backgroundColor: colors.dangerMuted }]}>
            <Ionicons name="warning-outline" size={28} color={colors.danger} />
          </View>

          <Text style={[styles.message, { color: colors.textPrimary }]}>{message}</Text>
          <Text style={[styles.subtext, { color: colors.textMuted }]}>
            Esta acción no se puede deshacer.
          </Text>

          <View style={styles.buttonRow}>
            <Pressable
              style={({ pressed }) => [
                styles.cancelBtn,
                { borderColor: colors.bgMuted },
                pressed && { backgroundColor: colors.bgMuted },
              ]}
              onPress={onCancel}
              accessibilityRole="button"
              accessibilityLabel="Cancelar"
            >
              <Text style={[styles.cancelText, { color: colors.textSecondary }]}>Cancelar</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                styles.deleteBtn,
                { backgroundColor: pressed ? colors.dangerDark : colors.danger },
              ]}
              onPress={onConfirm}
              accessibilityRole="button"
              accessibilityLabel="Eliminar"
            >
              <Text style={[styles.deleteText, { color: colors.textOnDanger }]}>Eliminar</Text>
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
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xxxl,
  },
  card: {
    borderRadius: Radii.xl,
    padding: Spacing.xxl,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    ...Shadows.md,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  message: {
    fontSize: Typography.md,
    fontWeight: Typography.semibold,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  subtext: {
    fontSize: Typography.sm,
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
    alignItems: 'center',
  },
  cancelText: {
    fontSize: Typography.base,
    fontWeight: Typography.medium,
  },
  deleteBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: Radii.md,
    alignItems: 'center',
  },
  deleteText: {
    fontSize: Typography.base,
    fontWeight: Typography.semibold,
  },
});
