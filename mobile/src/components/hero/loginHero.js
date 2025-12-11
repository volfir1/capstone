import React from "react";
import { View, Text, Image } from "react-native";
import loginStyles from "../../assets/styles/loginStyles";

export const LoginHero = () => {
  return (
    <View style={loginStyles.heroSection}>
      <View style={loginStyles.imagePlaceholder}>
        <Image
          source={require("../../assets/images/law.png")}
          style={loginStyles.heroImage}
        />
      </View>
      <View style={loginStyles.heroOverlay}>
        <Text style={loginStyles.heroTitle}>WELCOME BACK!</Text>
        <Text style={loginStyles.heroSubtitle}>
          Securely access your legal services and continue where you left off.
        </Text>
      </View>
    </View>
  );
};