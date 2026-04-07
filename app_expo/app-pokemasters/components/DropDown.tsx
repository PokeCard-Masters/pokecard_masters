import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';

const STATIC_ITEMS = [
  { label: 'Voir le pokedex', value: 'pokedex' },
  { label: 'Voir mes cartes', value: 'mes_cartes' },
];

type DropDownProps = {
  onSelect?: (value: string | null) => void;
};

export default function DropDown({ onSelect }: DropDownProps) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState<string | null>(null);
  const [items, setItems] = useState(STATIC_ITEMS);

  return (
    <View style={styles.container}>
      <DropDownPicker
        open={open}
        value={value}
        items={items}
        setOpen={setOpen}
        setValue={(cb) => {
          setValue(cb);
          const newValue = typeof cb === 'function' ? cb(value) : cb;
          onSelect?.(newValue);
        }}
        setItems={setItems}
        placeholder="Appuyez"
        style={styles.dropdown}
        dropDownContainerStyle={styles.dropdownContainer}
        placeholderStyle={styles.placeholderStyle}
        labelStyle={styles.labelStyle}
        listItemLabelStyle={styles.listItemLabelStyle}
        arrowIconStyle={styles.arrowIconStyle as any}
        tickIconStyle={styles.tickIconStyle as any}
        listItemContainerStyle={styles.listItemContainerStyle}
        selectedItemContainerStyle={styles.selectedItemContainerStyle}
        selectedItemLabelStyle={styles.selectedItemLabelStyle}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    marginBottom: 16,
    zIndex: 1000,
  },
  dropdown: {
    backgroundColor: '#1a1a2e',
    borderColor: '#a8842a55',
    borderWidth: 1,
    borderRadius: 12,
    minHeight: 44,
  },
  dropdownContainer: {
    backgroundColor: '#1a1a2e',
    borderColor: '#a8842a55',
    borderWidth: 1,
    borderRadius: 12,
    marginTop: 4,
  },
  placeholderStyle: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  labelStyle: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  arrowIconStyle: {
    tintColor: '#f0c040',
  },
  tickIconStyle: {
    tintColor: '#9c6bff',
  },
  listItemContainerStyle: {
    borderBottomWidth: 1,
    borderBottomColor: '#f0c04011',
  },
  selectedItemContainerStyle: {
    backgroundColor: '#9c6bff11',
  },
  selectedItemLabelStyle: {
    color: '#f0c040',
    fontWeight: '800',
  },
  listItemLabelStyle: {
    color: '#e8e8f0',
  },
});