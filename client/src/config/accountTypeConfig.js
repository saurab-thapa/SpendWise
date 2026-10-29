// Account Type Configuration
export const accountTypeConfig = {
  student: {
    displayName: "Student",
    accentColor: "#0F766E",
    description: "Track allowance, scholarship, education and everyday student costs.",
    dashboardHeading: "Student financial overview",
    dashboardSubheading: "Keep your income and essential expenses in view.",
    incomeOrder: ["Allowance", "Scholarship", "Part-time work", "Salary", "Freelance", "Gift", "Other"],
    expenseOrder: ["Education", "Food", "Transport", "Accommodation", "Books", "Bills", "Other"],
    budgetTemplate: ["Food", "Transport", "Education", "Accommodation"],
    focusTitle: "Student money focus"
  },
  workingProfessional: {
    displayName: "Working Professional",
    accentColor: "#12263F",
    description: "Manage salary, benefits, recurring bills and professional expenses.",
    dashboardHeading: "Professional financial overview",
    dashboardSubheading: "Review salary, recurring costs and monthly savings.",
    incomeOrder: ["Salary", "Bonus", "Business income", "Freelance", "Interest", "Other"],
    expenseOrder: ["Rent", "Bills", "Food", "Transport", "Healthcare", "Savings", "Other"],
    budgetTemplate: ["Rent", "Bills", "Food", "Transport", "Healthcare"],
    focusTitle: "Work money focus"
  },
  personalFinance: {
    displayName: "Personal Finance",
    accentColor: "#2F7D4F",
    description: "Use a flexible view for self-employment, home life, retirement or varied income.",
    dashboardHeading: "Personal finance overview",
    dashboardSubheading: "See your complete month in one practical view.",
    incomeOrder: ["Business income", "Freelance", "Salary", "Interest", "Gift", "Other"],
    expenseOrder: ["Food", "Bills", "Rent", "Healthcare", "Transport", "Personal care", "Other"],
    budgetTemplate: ["Food", "Bills", "Rent", "Healthcare", "Transport"],
    focusTitle: "Personal money focus"
  }
};
