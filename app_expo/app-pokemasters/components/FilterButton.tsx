import { TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from 'expo-router';
import { DrawerActions } from '@react-navigation/native';


export default function Drawerbutton() {
    const navigation = useNavigation();
    return (
        <TouchableOpacity
            style={styles.DrawerButton}
            onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
            >
                <Ionicons 
                    name="menu"
                    size={28}
                    color="white"
                    />
            </TouchableOpacity>
    )
}

const styles = StyleSheet.create({
    DrawerButton: {
        position: 'absolute',
        bottom: 90,
        right: 24,
        backgroundColor: '#9B9EF0',
        borderRadius: 32,
        width: 56,
        height: 56,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 6,
        shadowColor: '#000',
        shadowOpacity: 0.3,
        shadowRadius: 4,
        shadowOffset: {
            width: 0,
            height: 2
        },
    }
})