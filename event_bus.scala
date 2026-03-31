import scala.collection.mutable
import scala.concurrent.Future
import scala.concurrent.ExecutionContext.Implicits.global

// Thread-unsafe mutable state
object EventBus {
  private val handlers = mutable.Map[String, mutable.ListBuffer[Any => Unit]]()
  private var eventCount = 0

  def subscribe(event: String, handler: Any => Unit): Unit = {
    if (!handlers.contains(event)) {
      handlers(event) = mutable.ListBuffer()
    }
    handlers(event) += handler
  }

  def publish(event: String, data: Any): Unit = {
    eventCount += 1
    handlers.getOrElse(event, List()).foreach { handler =>
      handler(data)  // No error handling
    }
  }

  // Memory leak - handlers never removed
  def unsubscribe(event: String): Unit = {
    // TODO: implement this
  }

  def getCount: Int = eventCount
}

// Blocking in Future
object DataFetcher {
  def fetchAll(urls: List[String]): Future[List[String]] = {
    Future {
      urls.map { url =>
        val connection = new java.net.URL(url).openConnection()
        val stream = connection.getInputStream
        val result = scala.io.Source.fromInputStream(stream).mkString
        Thread.sleep(1000) // blocking in future
        result
      }
    }
  }
}

// Null usage in Scala
class UserService {
  private var currentUser: String = null

  def login(name: String): Unit = {
    currentUser = name
  }

  def getCurrentUserLength: Int = {
    currentUser.length  // NPE if not logged in
  }

  def logout(): Unit = {
    currentUser = null
  }
}

// Pattern match not exhaustive
sealed trait PaymentResult
case class Success(id: String) extends PaymentResult
case class Failure(reason: String) extends PaymentResult
case class Pending(retryAt: Long) extends PaymentResult

def handlePayment(result: PaymentResult): String = result match {
  case Success(id) => s"Paid: $id"
  case Failure(reason) => s"Failed: $reason"
  // Missing Pending case
}

// Mutable case class
case class Config(var host: String, var port: Int, var debug: Boolean)

// Side effects in lazy val
object AppConfig {
  lazy val settings: Map[String, String] = {
    println("Loading config from database...")
    val conn = java.sql.DriverManager.getConnection("jdbc:mysql://localhost/db", "root", "pass")
    val stmt = conn.createStatement()
    val rs = stmt.executeQuery("SELECT key, value FROM settings")
    val map = mutable.Map[String, String]()
    while (rs.next()) {
      map(rs.getString("key")) = rs.getString("value")
    }
    map.toMap
    // connection never closed
  }
}

// Var in loop
def sumList(numbers: List[Int]): Int = {
  var sum = 0
  var i = 0
  while (i < numbers.length) {
    sum += numbers(i)
    i += 1
  }
  sum
}
