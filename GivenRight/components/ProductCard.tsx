import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Platform,
} from "react-native";
import * as WebBrowser from "expo-web-browser";
import { Linking } from "react-native";
import { Product } from "../types/product";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const handlePress = async () => {
    if (Platform.OS === "web") {
      window.open(product.affiliateUrl, "_blank");
    } else {
      try {
        await WebBrowser.openBrowserAsync(product.affiliateUrl);
      } catch {
        Linking.openURL(product.affiliateUrl);
      }
    }
  };

  const formatPrice = (price: number, currency: string): string => {
    const symbols: Record<string, string> = {
      USD: "$",
      EUR: "€",
      GBP: "£",
    };
    const symbol = symbols[currency] || "$";
    return `${symbol}${price.toFixed(0)}`;
  };

  const renderStars = (rating: number) => {
    const fullStars = Math.floor(rating);
    const hasHalf = rating - fullStars >= 0.5;
    let stars = "★".repeat(fullStars);
    if (hasHalf) stars += "☆";
    return stars;
  };

  const priceText = formatPrice(product.price, product.currency);
  const ratingText = `${product.rating.toFixed(1)} out of 5 stars, ${product.reviewCount.toLocaleString()} reviews`;

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handlePress}
      activeOpacity={0.7}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={`${product.title}, ${priceText}, ${ratingText}. Tap to view on Amazon.`}
      accessibilityHint="Opens product page in browser"
    >
      <Image
        source={{ uri: product.imageUrl }}
        style={styles.image}
        resizeMode="cover"
        accessible={true}
        accessibilityLabel={`Product image: ${product.title}`}
      />
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>
          {product.title}
        </Text>
        <Text style={styles.price} accessibilityLabel={`Price: ${priceText}`}>
          {priceText}
        </Text>
        <View style={styles.ratingRow} accessibilityLabel={ratingText}>
          <Text style={styles.stars} aria-hidden={true}>{renderStars(product.rating)}</Text>
          <Text style={styles.rating}>{product.rating.toFixed(1)}</Text>
          <Text style={styles.reviews}>({product.reviewCount.toLocaleString()})</Text>
        </View>
        <Text style={styles.amazonLabel}>Available on Amazon</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    marginBottom: 12,
    overflow: "hidden",
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  image: {
    width: 100,
    height: 100,
  },
  content: {
    flex: 1,
    padding: 12,
    justifyContent: "space-between",
  },
  title: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1F2937",
    lineHeight: 18,
  },
  price: {
    fontSize: 16,
    fontWeight: "700",
    color: "#059669",
    marginTop: 4,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  stars: {
    fontSize: 12,
    color: "#F59E0B",
    marginRight: 4,
  },
  rating: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6B7280",
    marginRight: 4,
  },
  reviews: {
    fontSize: 11,
    color: "#9CA3AF",
  },
  amazonLabel: {
    fontSize: 10,
    color: "#9CA3AF",
    marginTop: 4,
    fontStyle: "italic",
  },
});