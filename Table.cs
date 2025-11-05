namespace DataStructures;

/// <summary>
/// A sealed empty Table class using C# 12 syntax.
/// </summary>
public sealed class Table;

public partial class TMap<TGroup, TMap>;

/// <summary>
/// A generic partial table implementation with grouping and mapping capabilities.
/// Uses C# 12 primary constructors and collection expressions.
/// </summary>
/// <typeparam name="TGroup">The type used for grouping rows.</typeparam>
/// <typeparam name="TMap">The type used for mapping values.</typeparam>
public partial class Tables<TGroup, TMap>
{
    private readonly Dictionary<TGroup, List<TMap>> _groupedData = [];

    public int GroupCount => _groupedData.Count;

    public void AddToGroup(TGroup group, TMap item)
    {
        ArgumentNullException.ThrowIfNull(group);
        ArgumentNullException.ThrowIfNull(item);

        if (!_groupedData.ContainsKey(group))
        {
            _groupedData[group] = [];
        }

        _groupedData[group].Add(item);
    }

    public IReadOnlyList<TMap>? GetGroup(TGroup group)
    {
        return _groupedData.TryGetValue(group, out var items)
            ? items.AsReadOnly()
            : null;
    }

    public IEnumerable<TGroup> GetAllGroups()
    {
        return _groupedData.Keys;
    }

    public void RemoveGroup(TGroup group)
    {
        _groupedData.Remove(group);
    }
}

/// <summary>
/// Additional functionality for the partial Table class.
/// </summary>
public partial class Tables<TGroup, TMap>
{
    public bool HasGroup(TGroup group)
    {
        return _groupedData.ContainsKey(group);
    }

    public int GetGroupSize(TGroup group)
    {
        return _groupedData.TryGetValue(group, out var items) ? items.Count : 0;
    }

    public void ClearAllGroups()
    {
        _groupedData.Clear();
    }

    public Dictionary<TGroup, int> GetGroupSummary()
    {
        return _groupedData.ToDictionary(
            kvp => kvp.Key,
            kvp => kvp.Value.Count
        );
    }
}
