import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  vegOnly: false,
  searchQuery: "",
  selectedCategory: "All",
};

const preferencesSlice = createSlice({
  name: "preferences",
  initialState,
  reducers: {
    toggleVegOnly: (state) => {
      state.vegOnly = !state.vegOnly;
    },
    setVegOnly: (state, action) => {
      state.vegOnly = action.payload;
    },
    setSearchQuery: (state, action) => {
      state.searchQuery = action.payload;
    },
    setSelectedCategory: (state, action) => {
      state.selectedCategory = action.payload;
    },
  },
});

export const {
  toggleVegOnly,
  setVegOnly,
  setSearchQuery,
  setSelectedCategory,
} = preferencesSlice.actions;

export const selectVegOnly = (state) => state.preferences.vegOnly;
export const selectSearchQuery = (state) => state.preferences.searchQuery;
export const selectSelectedCategory = (state) =>
  state.preferences.selectedCategory;

export default preferencesSlice.reducer;
