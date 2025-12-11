import React from "react";
import { View, Text, Image } from "react-native";
import signupStyles from "../../assets/styles/signupStyles";

export const SignupHero = () => {
  return (
    <View style={signupStyles.heroSection}>
      <View style={signupStyles.imagePlaceholder}>
        <Image
          source={require("../../assets/images/law.png")}
          style={signupStyles.heroImage}
        />
      </View>
      <View style={signupStyles.heroOverlay}>
        <Text style={signupStyles.heroTitle}>JOIN US TODAY!</Text>
        <Text style={signupStyles.heroSubtitle}>
          Create your account and start accessing our comprehensive legal
          services.
        </Text>
      </View>
    </View>
  );
};