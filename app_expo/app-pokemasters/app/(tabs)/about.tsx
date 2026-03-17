import { View, Text, StyleSheet } from 'react-native';

export default function AboutScreen() {
    return (
        <View style={styles.container}>
            <Text style={styles.text}>## Page de jeu ##</Text>
        </View>
    )
}

const styles = StyleSheet.create({ 
    container: {
        flex: 1,
        backgroundColor: '#F8F8FF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    text: {
        color: '#202020',
    },
})