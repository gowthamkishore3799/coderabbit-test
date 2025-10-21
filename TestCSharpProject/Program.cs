using System;
using System.Collections.Generic;
using Newtonsoft.Json;

namespace TestCSharpProject
{
    /// <summary>
    /// Main program entry point
    /// </summary>
    class Program
    {
        static void Main(string[] args)
        {
            Console.WriteLine("Test C# Project - Running...");

            // Example using Newtonsoft.Json from .csproj dependencies
            var testData = new Dictionary<string, object>
            {
                { "name", "TestProject" },
                { "version", "1.0.0" },
                { "timestamp", DateTime.Now }
            };

            string json = JsonConvert.SerializeObject(testData, Formatting.Indented);
            Console.WriteLine("Serialized Data:");
            Console.WriteLine(json);

            // Run tests
            var calculator = new Calculator();
            Console.WriteLine($"\nCalculator Test: 5 + 3 = {calculator.Add(5, 3)}");
        }
    }
}
