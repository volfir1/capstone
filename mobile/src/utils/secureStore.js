import * as SecureStore from 'expo-secure-store'
import AsyncStorage from '@react-native-async-storage/async-storage'

//Store token securely in device keychain/keystore
export const storeToken = async (token) =>{
     try{
        await SecureStore.setItemAsync('firebaseToken', token)
        console.log("Token stored securely")
    }catch(error){
        console.error("Failed to store token", error)
        throw error
    }
}


//retirieve token from secure storage
export const getStoredToken = async () =>{
    try{
        const token = await SecureStore.getItemAsync('firebaseToken')
        if(token){
            console.log("Token retrieved from storage")
        }else{
            console.log("No token found in storage")
        }
        return token
    }catch(error){
        console.error("Failed to get token", error)
        return null
    }
}

//clear token from secure store
export const clearToken = async () => {
    try{
        await SecureStore.deleteItemAsync('firebaseToken')
        console.log("token cleared from storage")
    }catch(error){
        console.error("Failed to clear token", error)
        throw error
    }
}

// check if token exist in storage
export const hasStoredToken = async ()=>{
    try{
        const token = await SecureStore.getItemAsync("firebaseToken")
        return !!token
    }catch(error){
        console.error("Failed to check token:", error)
        return false
    }
}


//store any secure data
export const storeSecureData = async (key, value) =>{
    try{
        await SecureStore.setItemAsync(key, value)
        console.log(`${key} stored securely`)
    }catch(error){
        console.error(`Failed to store ${key}:`, error)
        throw error
    }
}

//Retrieve any secure data
export const getSecureData = async (key) =>{
    try{
        const value = await SecureStore.getItemAsync(key)
        return value
    }catch(error){
        console.error(`Failed to get ${key}`, error)
        return null
    }
}

export const clearSecureData = async (key) =>{
    try{
        await SecureStore.deleteItemAsync(key)
        console.log(`${key} cleared from storage`)
    }catch(error){
        console.error(`Filed to clear ${key}`, error)
        throw error
    }
}

// Cache user data using AsyncStorage (no size limit unlike SecureStore)
export const storeUserData = async (data) => {
    try {
        await AsyncStorage.setItem('cachedUserData', JSON.stringify(data));
    } catch (error) {
        console.error('Failed to cache user data:', error);
    }
};

export const getStoredUserData = async () => {
    try {
        const data = await AsyncStorage.getItem('cachedUserData');
        return data ? JSON.parse(data) : null;
    } catch (error) {
        console.error('Failed to get cached user data:', error);
        return null;
    }
};

export const clearUserData = async () => {
    try {
        await AsyncStorage.removeItem('cachedUserData');
    } catch (error) {
        console.error('Failed to clear cached user data:', error);
    }
};