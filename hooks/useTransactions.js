import { useCallback, useState } from "react";
import { Alert } from "react-native";
import { API_URL } from "../constants/api";


export const useTransactions = (userId) => {
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState({
    balance: 0,
    income: 0,
    expenses: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  // helper to parse JSON and log raw text on failure
  const parseJsonResponse = async (response) => {
    const text = await response.text();
    if (!response.ok) {
      console.error("API responded with non-OK status", response.status, text);
      throw new Error(`API error ${response.status}`);
    }
    try {
      return JSON.parse(text);
    } catch (err) {
      console.error("Failed to parse JSON. Raw response:", text);
      throw err;
    }
  };

  const fetchTransactions = useCallback(async () => {
    if (!userId) return;
    try {
      const url = `${API_URL}/transactions/${userId}`;
      console.log("fetchTransactions ->", url);
      const response = await fetch(url);
      const data = await parseJsonResponse(response);
      setTransactions(data);
    } catch (error) {
      console.error("Error fetching transactions:", error);
    }
  }, [userId]);

  const fetchSummary = useCallback(async () => {
    if (!userId) return;
    try {
      const url = `${API_URL}/transactions/summary/${userId}`;
      console.log("fetchSummary ->", url);
      const response = await fetch(url);
      const data = await parseJsonResponse(response);

      const normalized = {
        balance: Number(data?.balance ?? data?.total_balance ?? 0),
        income: Number(data?.income ?? data?.total_income ?? 0),
        expenses: Number(data?.expenses ?? data?.expense ?? data?.total_expenses ?? 0),
      };
      console.log("summary raw:", data, "normalized:", normalized);
      setSummary(normalized);
    } catch (error) {
      console.error("Error fetching summary:", error);
    }
  }, [userId]);

  const loadData = useCallback(async () => {
    if (!userId) return;

    setIsLoading(true);
    try {
      await Promise.all([fetchTransactions(), fetchSummary()]);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [fetchTransactions, fetchSummary, userId]);

  const deleteTransaction = async (id) => {
    try {
      const url = `${API_URL}/transactions/${id}`;
      console.log("deleteTransaction ->", url);
      const response = await fetch(url, { method: "DELETE" });
      if (!response.ok) {
        const text = await response.text();
        console.error("Delete failed:", response.status, text);
        throw new Error("Failed to delete transaction");
      }
      await loadData();
      Alert.alert("Success", "Transaction deleted successfully");
    } catch (error) {
      console.error("Error deleting transaction:", error);
      Alert.alert("Error", error.message);
    }
  };

  return { transactions, summary, isLoading, loadData, deleteTransaction };
};