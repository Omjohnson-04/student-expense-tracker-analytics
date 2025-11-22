import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  Button,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';

function isSameMonth(d1, d2) {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth()
  );
}

function isSameWeek(d1, d2) {
  const oneJan = new Date(d1.getFullYear(), 0, 1);
  const msInDay = 24 * 60 * 60 * 1000;

  const d1Day = Math.floor((d1 - oneJan) / msInDay);
  const d2Day = Math.floor((d2 - oneJan) / msInDay);

  const week1 = Math.floor(d1Day / 7);
  const week2 = Math.floor(d2Day / 7);

  return d1.getFullYear() === d2.getFullYear() && week1 === week2;
}

export default function ExpenseScreen() {
  const db = useSQLiteContext();
  const [expenses, setExpenses] = useState([]);
  const [filter, setFilter] = useState('ALL');
  const [editingExpense, setEditingExpense] = useState(null);
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [note, setNote] = useState('');

  const loadExpenses = async () => {
    const rows = await db.getAllAsync(
      'SELECT * FROM expenses ORDER BY id DESC;'
    );
    setExpenses(rows);
  };
  const addExpense = async () => {
    const amountNumber = parseFloat(amount);

    if (isNaN(amountNumber) || amountNumber <= 0) {
      return;
    }

    const trimmedCategory = category.trim();
    const trimmedNote = note.trim();

    if (!trimmedCategory) {
      // Category is required
      return;
    }

    await db.runAsync(
      'INSERT INTO expenses (amount, category, note, date) VALUES (?, ?, ?, ?);',
      [amountNumber, trimmedCategory, trimmedNote, today || null]
    );

    setAmount('');
    setCategory('');
    setNote('');
    

    loadExpenses();
  };


  const deleteExpense = async (id) => {
    await db.runAsync('DELETE FROM expenses WHERE id = ?;', [id]);
    loadExpenses();
  };


  const renderExpense = ({ item }) => (
    <TouchableOpacity
      style={styles.expenseRow}
      onPress={() => setEditingExpense(item)}
      >
      <View style={{ flex: 1 }}>
        <Text style={styles.expenseAmount}>${Number(item.amount).toFixed(2)}</Text>
        <Text style={styles.expenseCategory}>{item.category}</Text>
        {item.note ? <Text style={styles.expenseNote}>{item.note}</Text> : null}
      </View>

      <TouchableOpacity onPress={() => deleteExpense(item.id)}>
        <Text style={styles.delete}>✕</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  useEffect(() => {
    async function setup() {
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS expenses (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          amount REAL NOT NULL,
          category TEXT NOT NULL,
          note TEXT,
          date TEXT NOT NULL
        );
      `);

      await loadExpenses();
    }

    setup();
  }, []);

  const today = new Date();

  const filteredExpenses = expenses.filter((exp) => {
    if (!exp.date) return filter === 'ALL';

    const expDate = new Date(exp.date);

    if (filter === 'WEEK') {
      return isSameWeek(expDate, today);
    }
    if (filter === 'MONTH') {
      return isSameMonth(expDate, today);
    }
    return true;
  });

  async function handleSaveEdit() {
    if (!editingExpense) return;
  
    const { id, amount, category, note, date } = editingExpense;
  
    if (!amount || !category || !date) {
      alert('Amount, category, and date are required.');
      return;
    }
  
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      alert('Amount must be a positive number.');
      return;
    }
  
    try {
      await db.runAsync(
        'UPDATE expenses SET amount = ?, category = ?, note = ?, date = ? WHERE id = ?;',
        [numericAmount, category, note, date, id]
      );

      await loadExpenses();
  
      setEditingExpense(null);
    } catch (e) {
      console.error(e);
      alert('Error updating expense');
    }
  }

  const overallTotal = filteredExpenses.reduce((sum, exp) => {
    const amt = typeof exp.amount === 'number' ? exp.amount : parseFloat(exp.amount);
    return sum + (isNaN(amt) ? 0 : amt);
  }, 0);

  const totalsByCategory = filteredExpenses.reduce((acc, exp) => {
    const cat = exp.category || 'Uncategorized';
    const amt = typeof exp.amount === 'number' ? exp.amount : parseFloat(exp.amount);

    if (!acc[cat]) acc[cat] = 0;
    acc[cat] += isNaN(amt) ? 0 : amt;

    return acc;
  }, {});

  return (
    <View style={{ flex: 1, padding: 16 }}>
      {/* filter buttons can use setFilter */}
      {/* use filteredExpenses in FlatList */}
      <Modal
      visible={!!editingExpense}
      animationType="slide"
      transparent={false}
    >
      {editingExpense && (
        <View style={{ padding: 16 }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 12 }}>
            Edit Expense
          </Text>

          <Text>Amount</Text>
          <TextInput
            style={{ borderWidth: 1, marginBottom: 8, padding: 8 }}
            keyboardType="numeric"
            value={String(editingExpense.amount)}
            onChangeText={(text) =>
              setEditingExpense((prev) => ({ ...prev, amount: text }))
            }
          />

          <Text>Category</Text>
          <TextInput
            style={{ borderWidth: 1, marginBottom: 8, padding: 8 }}
            value={editingExpense.category}
            onChangeText={(text) =>
              setEditingExpense((prev) => ({ ...prev, category: text }))
            }
          />

          <Text>Note</Text>
          <TextInput
            style={{ borderWidth: 1, marginBottom: 8, padding: 8 }}
            value={editingExpense.note}
            onChangeText={(text) =>
              setEditingExpense((prev) => ({ ...prev, note: text }))
            }
          />

          <Text>Date (YYYY-MM-DD)</Text>
          <TextInput
            style={{ borderWidth: 1, marginBottom: 16, padding: 8 }}
            value={editingExpense.date}
            onChangeText={(text) =>
              setEditingExpense((prev) => ({ ...prev, date: text }))
            }
          />

          <Button title="Save" onPress={handleSaveEdit} />
          <Button title="Cancel" onPress={() => setEditingExpense(null)} />
        </View>
      )}
      </Modal>
      <FlatList
        data={filteredExpenses}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
      />
    </View>
  );
}

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.heading}>Student Expense Tracker</Text>

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Amount (e.g. 12.50)"
          placeholderTextColor="#9ca3af"
          keyboardType="numeric"
          value={amount}
          onChangeText={setAmount}
        />
        <TextInput
          style={styles.input}
          placeholder="Category (Food, Books, Rent...)"
          placeholderTextColor="#9ca3af"
          value={category}
          onChangeText={setCategory}
        />
        <TextInput
          style={styles.input}
          placeholder="Note (optional)"
          placeholderTextColor="#9ca3af"
          value={note}
          onChangeText={setNote}
        />
        <Button title="Add Expense" onPress={addExpense} />
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginVertical: 8 }}>
        <TouchableOpacity onPress={() => setFilter('ALL')}>
          <Text style={{ fontWeight: filter === 'ALL' ? 'bold' : 'normal' }}>All</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setFilter('WEEK')}>
          <Text style={{ fontWeight: filter === 'WEEK' ? 'bold' : 'normal' }}>This Week</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setFilter('MONTH')}>
          <Text style={{ fontWeight: filter === 'MONTH' ? 'bold' : 'normal' }}>This Month</Text>
        </TouchableOpacity>
      </View>

      <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 8 }}>
      Total Spending (
      {filter === 'ALL' ? 'All' : filter === 'WEEK' ? 'This Week' : 'This Month'}
      ): ${overallTotal.toFixed(2)}
    </Text>

      <View style={{ marginBottom: 12 }}>
        <Text style={{ fontWeight: 'bold', marginBottom: 4 }}>
          By Category (
          {filter === 'ALL' ? 'All' : filter === 'WEEK' ? 'This Week' : 'This Month'}
          ):
        </Text>
        {Object.entries(totalsByCategory).map(([cat, total]) => (
          <Text key={cat}>
            • {cat}: ${total.toFixed(2)}
          </Text>
        ))}
      </View>

      <FlatList
        data={filteredExpenses}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderExpense}
        ListEmptyComponent={
          <Text style={styles.empty}>No expenses yet.</Text>
        }
      />

      <Text style={styles.footer}>
        Enter your expenses and they’ll be saved locally with SQLite.
      </Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#111827' },
  heading: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 16,
  },
  form: {
    marginBottom: 16,
    gap: 8,
  },
  input: {
    padding: 10,
    backgroundColor: '#1f2937',
    color: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#374151',
  },
  expenseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1f2937',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  expenseAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fbbf24',
  },
  expenseCategory: {
    fontSize: 14,
    color: '#e5e7eb',
  },
  expenseNote: {
    fontSize: 12,
    color: '#9ca3af',
  },
  delete: {
    color: '#f87171',
    fontSize: 20,
    marginLeft: 12,
  },
  empty: {
    color: '#9ca3af',
    marginTop: 24,
    textAlign: 'center',
  },
  footer: {
    textAlign: 'center',
    color: '#6b7280',
    marginTop: 12,
    fontSize: 12,
  },
});