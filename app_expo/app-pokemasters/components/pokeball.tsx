import { View } from 'react-native';

const Pokeball = ({ size = 80 }) => {
  const border = Math.max(2, size * 0.04);
  const centerBtn = size * 0.22;
  const centerBtnInner = size * 0.12;

  return (
    <View style={{
      width: size, height: size,
      borderRadius: size / 2,
      borderWidth: border, borderColor: '#111',
      overflow: 'hidden', backgroundColor: '#fff',
    }}>
      <View style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '50%',
        backgroundColor: '#e3000b'
      }}
      />
      <View style={{
        position: 'absolute',
        top: size / 2 - border,
        left: 0,
        right: 0,
        height: border * 2,
        backgroundColor: '#111',
        zIndex: 1
      }}
      />
      <View style={{
        position: 'absolute',
        top: size / 2 - centerBtn /
          2, left: size /
            2 - centerBtn /
            2, width: centerBtn,
        height: centerBtn,
        borderRadius: centerBtn /
          2, backgroundColor: '#fff',
        borderWidth: border,
        borderColor: '#111',
        zIndex: 2,
        justifyContent: 'center',
        alignItems: 'center'
      }}
      >
        <View style={{
          width: centerBtnInner,
          height: centerBtnInner,
          borderRadius: centerBtnInner /
            2, backgroundColor: '#e0e0e0'
        }}
        />
      </View>
    </View>
  );
};

export default Pokeball;