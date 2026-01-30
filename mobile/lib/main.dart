import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:provider/provider.dart';
// import 'package:flutter_appauth/flutter_appauth.dart'; // Commented out to avoid compilation errors if package not retrieved

void main() {
  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()),
      ],
      child: const MyApp(),
    ),
  );
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Real Estate POC',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.blue),
        useMaterial3: true,
      ),
      home: const MainWrapper(),
    );
  }
}

class MainWrapper extends StatelessWidget {
  const MainWrapper({super.key});

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    return auth.isAuthenticated ? const HomeScreen() : const LoginScreen();
  }
}

// ---------------------------------------------------------------------------
// Auth Provider (Mock/OIDC Placeholder)
// ---------------------------------------------------------------------------
class AuthProvider extends ChangeNotifier {
  bool _isAuthenticated = false;
  String? _accessToken;
  
  bool get isAuthenticated => _isAuthenticated;
  String? get accessToken => _accessToken;

  // Placeholder for OIDC - In real app use FlutterAppAuth
  Future<void> login() async {
    // Simulate OIDC login flow
    await Future.delayed(const Duration(seconds: 1));
    _isAuthenticated = true;
    _accessToken = "mock_access_token";
    notifyListeners();
  }

  Future<void> logout() async {
    _isAuthenticated = false;
    _accessToken = null;
    notifyListeners();
  }
}

// ---------------------------------------------------------------------------
// Login Screen
// ---------------------------------------------------------------------------
class LoginScreen extends StatelessWidget {
  const LoginScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(32.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.home_work_outlined, size: 80, color: Colors.blue),
              const SizedBox(height: 24),
              const Text(
                'Real Estate POC',
                style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 48),
              ElevatedButton(
                onPressed: () {
                  context.read<AuthProvider>().login();
                },
                style: ElevatedButton.styleFrom(
                  minimumSize: const Size(double.infinity, 50),
                  backgroundColor: Colors.blue,
                  foregroundColor: Colors.white,
                ),
                child: const Text('Login with Zitadel'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Home Screen
// ---------------------------------------------------------------------------
class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  List<dynamic> properties = [];
  bool loading = true;

  @override
  void initState() {
    super.initState();
    fetchProperties();
  }

  Future<void> fetchProperties() async {
    // 10.0.2.2 is localhost for Android Emulator
    // Replace with your machine IP if running on real device
    const String baseUrl = 'http://10.0.2.2:3001'; 
    try {
      final res = await http.get(Uri.parse('$baseUrl/properties'));
      if (res.statusCode == 200) {
        setState(() {
          properties = json.decode(res.body);
          loading = false;
        });
      } else {
        throw Exception('Failed to load');
      }
    } catch (e) {
      debugPrint("Error fetching properties: $e");
      setState(() => loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.read<AuthProvider>();
    return Scaffold(
      appBar: AppBar(
        title: const Text('Featured Properties'),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: () => auth.logout(),
          )
        ],
      ),
      body: loading
          ? const Center(child: CircularProgressIndicator())
          : ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: properties.length,
              itemBuilder: (context, index) {
                final prop = properties[index];
                return Card(
                  clipBehavior: Clip.antiAlias,
                  margin: const EdgeInsets.only(bottom: 16),
                  elevation: 2,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(
                        height: 200,
                        color: Colors.grey.shade300,
                        child: Image.network(
                          prop['imageUrl'] ?? '',
                          width: double.infinity,
                          fit: BoxFit.cover,
                          errorBuilder: (c,e,s) => const Center(child: Icon(Icons.image_not_supported)),
                        ),
                      ),
                      Padding(
                        padding: const EdgeInsets.all(16.0),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              prop['title'] ?? 'No Title',
                              style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                            ),
                            const SizedBox(height: 8),
                            Text(
                              '€${prop['price']}',
                              style: const TextStyle(fontSize: 16, color: Colors.blue, fontWeight: FontWeight.bold),
                            ),
                            const SizedBox(height: 8),
                            Text(prop['description'] ?? ''),
                          ],
                        ),
                      ),
                    ],
                  ),
                );
              },
            ),
    );
  }
}
