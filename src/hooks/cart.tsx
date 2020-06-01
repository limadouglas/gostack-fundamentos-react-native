import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const productsCartList = await AsyncStorage.getItem(
        '@GoMarketplace:cartProducts',
      );

      if (productsCartList) {
        const productsCartListFormatted: Product[] = JSON.parse(
          productsCartList,
        );
        setProducts(productsCartListFormatted);
      }
    }

    loadProducts();
  }, []);

  const addToCart = useCallback(
    async product => {
      const productExist = products.find(prod => prod.id === product.id);

      if (productExist) {
        setProducts(
          products.map(p =>
            p.id === product.id ? { ...product, quantity: p.quantity + 1 } : p,
          ),
        );
      } else {
        setProducts([...products, { ...product, quantity: 1 }]);
      }
      await AsyncStorage.setItem(
        '@GoMarketplace:cartProducts',
        JSON.stringify(products),
      );
    },
    [products],
  );

  const increment = useCallback(
    async id => {
      const listProducts = products.map<Product>(prod => {
        if (prod.id === id) {
          prod.quantity += 1;
        }
        return prod;
      });

      setProducts(listProducts);

      await AsyncStorage.setItem(
        '@GoMarketplace:cartProducts',
        JSON.stringify(products),
      );
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      const productsList = products.map((prod, index) => {
        if (prod.id === id) {
          prod.quantity -= 1;
        }
        return prod;
      });

      const newProducts = productsList.filter(prod => prod.quantity > 0) || [];

      setProducts(newProducts);

      await AsyncStorage.setItem(
        '@GoMarketplace:cartProducts',
        JSON.stringify(products),
      );
    },
    [products],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
