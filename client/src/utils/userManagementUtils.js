import { useState } from "react";
/**
 * Filters an array of user objects based on a search query and a status filter.
 *
 * @param {Array} users - The array of user objects to filter.
 * @param {string} searchQuery - The text to search for in user names and emails.
 * @param {string|null} statusFilter - The status to filter by (e.g., 'Active', 'Inactive').
 * @returns {Array} The new filtered array of users.
 */


export function useSearch(initialValue = '') {
  const [searchQuery, setSearchQuery] = useState(initialValue);

  // Return the state and the function to modify it
  return { searchQuery, setSearchQuery };
}

export function filterUsers(users, searchQuery, statusFilter) {
  // Return an empty array if there's nothing to filter
  if (!users) {
    return [];
  }

  return users.filter((item) => {
    // Condition 1: Check if the user matches the search query (case-insensitive)
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.email.toLowerCase().includes(searchQuery.toLowerCase());

    // Condition 2: Check if the user matches the status filter
    // This passes if no filter is selected OR if statusFilter is "All" OR if the status matches
    const matchesStatus = !statusFilter || statusFilter === "All" || item.status === statusFilter;

    // The user must match both conditions to be included
    return matchesSearch && matchesStatus;
  });
}

export const getStatusColor = (status) =>{
  return status === "Active" ? "#7E30E1" : "#A6A6A6";
}