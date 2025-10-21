using System;

namespace TestCSharpProject
{
    /// <summary>
    /// Simple calculator class for testing
    /// </summary>
    public class Calculator
    {
        // BREAKING CHANGE: Changed method signatures from int to string parameters
        public string Add(string a, string b)
        {
            int numA = int.Parse(a);
            int numB = int.Parse(b);
            return (numA + numB).ToString();
        }

        public string Subtract(string a, string b)
        {
            int numA = int.Parse(a);
            int numB = int.Parse(b);
            return (numA - numB).ToString();
        }

        public string Multiply(string a, string b)
        {
            int numA = int.Parse(a);
            int numB = int.Parse(b);
            return (numA * numB).ToString();
        }

        public string Divide(string a, string b)
        {
            int numA = int.Parse(a);
            int numB = int.Parse(b);
            if (numB == 0)
            {
                throw new DivideByZeroException("Cannot divide by zero");
            }
            return ((double)numA / numB).ToString();
        }
    }
}
