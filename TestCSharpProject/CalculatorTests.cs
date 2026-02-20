using NUnit.Framework;
using System;

namespace TestCSharpProject
{
    /// <summary>
    /// NUnit tests for Calculator class - uses NUnit from .csproj dependencies
    /// </summary>
    [TestFixture]
    public class CalculatorTests
    {
        private Calculator _calculator;

        [SetUp]
        public void Setup()
        {
            _calculator = new Calculator();
        }

        [Test]
        public void Add_TwoPositiveNumbers_ReturnsSum()
        {
            // Arrange
            int a = 5;
            int b = 3;

            // Act
            int result = _calculator.Add(a, b);

            // Assert
            Assert.AreEqual(8, result);
        }

        [Test]
        public void Subtract_TwoNumbers_ReturnsDifference()
        {
            // Arrange
            int a = 10;
            int b = 4;

            // Act
            int result = _calculator.Subtract(a, b);

            // Assert
            Assert.AreEqual(6, result);
        }

        [Test]
        public void Multiply_TwoNumbers_ReturnsProduct()
        {
            // Arrange
            int a = 6;
            int b = 7;

            // Act
            int result = _calculator.Multiply(a, b);

            // Assert
            Assert.AreEqual(42, result);
        }

        [Test]
        public void Divide_ValidNumbers_ReturnsQuotient()
        {
            // Arrange
            int a = 10;
            int b = 2;

            // Act
            double result = _calculator.Divide(a, b);

            // Assert
            Assert.AreEqual(5.0, result);
        }

        [Test]
        public void Divide_ByZero_ThrowsException()
        {
            // Arrange
            int a = 10;
            int b = 0;

            // Act & Assert
            Assert.Throws<DivideByZeroException>(() => _calculator.Divide(a, b));
        }
    }
}
