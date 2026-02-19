import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Switch,
  TextInput
} from 'react-native';
import { supabase } from '../services/DatabaseService';

/**
 * OnboardingScreen
 * 
 * Vollständiger Onboarding-Flow:
 * 1. Willkommen & Produktvorstellung
 * 2. §536b Check (Prüfung Mietminderungsberechtigung)
 * 3. Berechtigungen (Audio, Notifications)
 * 4. DSGVO-Consent
 * 5. Auth (Anmeldung/Registrierung)
 */

const STEPS = {
  WELCOME: 1,
  CHECK_536B: 2,
  PERMISSIONS: 3,
  DSGVO: 4,
  AUTH: 5
};

// §536b Check-Fragen
const CHECK_536B_QUESTIONS = [
  {
    id: 'mietvertrag',
    question: 'Haben Sie einen gültigen Mietvertrag?',
    info: 'Ein gültiger Mietvertrag ist Voraussetzung für Mietminderungsansprüche.',
    important: true
  },
  {
    id: 'wohnung_bezogen',
    question: 'Haben Sie die Wohnung bereits bezogen?',
    info: 'Mietminderung kann erst ab Bezug geltend gemacht werden.',
    important: true
  },
  {
    id: 'laerm_quelle',
    question: 'Woher kommt der Lärm?',
    options: [
      { value: 'nachbar', label: 'Vom Nachbarn (Wohnung/Mauer)', score: 1 },
      { value: 'strasse', label: 'Von der Straße (Verkehr)', score: 0 },
      { value: 'gewerbe', label: 'Vom Gewerbe im Haus', score: 1 },
      { value: 'baustelle', label: 'Von Baustelle in der Nähe', score: 0.5 },
      { value: 'unsicher', label: 'Unsicher', score: 0 }
    ],
    info: 'Mietminderung ist bei Nachbar- und Haus-Gewerbe-Lärm am einfachsten durchzusetzen.'
  },
  {
    id: 'vermieter_informiert',
    question: 'Haben Sie den Vermieter bereits informiert?',
    options: [
      { value: 'ja', label: 'Ja, schriftlich', score: 1 },
      { value: 'muendlich', label: 'Ja, mündlich', score: 0.5 },
      { value: 'nein', label: 'Nein', score: 0 },
      { value: 'mehrfach', label: 'Mehrfach, ohne Erfolg', score: 1.5 }
    ],
    info: 'Der Vermieter muss Gelegenheit zur Abhilfe erhalten (§ 536b BGB).'
  },
  {
    id: 'stoerungsdauer',
    question: 'Wie lange besteht die Störung bereits?',
    options: [
      { value: 'wenige_tage', label: 'Wenige Tage', score: 0.5 },
      { value: 'wochen', label: '1-4 Wochen', score: 1 },
      { value: 'monate', label: '1-6 Monate', score: 1.5 },
      { value: 'lang', label: 'Länger als 6 Monate', score: 2 }
    ],
    info: 'Länger andauernde Störungen haben höhere Erfolgsaussichten.'
  }
];

export default function OnboardingScreen({ onComplete }) {
  const [currentStep, setCurrentStep] = useState(STEPS.WELCOME);
  const [isLoading, setIsLoading] = useState(false);
  
  // §536b Check State
  const [checkAnswers, setCheckAnswers] = useState({});
  const [eligibilityScore, setEligibilityScore] = useState(0);
  
  // DSGVO State
  const [consents, setConsents] = useState({
    measurement: false,
    storage: false,
    sharing: false,
    marketing: false
  });
  
  // Auth State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);

  // Berechne Eligibility Score
  useEffect(() => {
    let score = 0;
    const answers = Object.values(checkAnswers);
    
    answers.forEach(answer => {
      if (typeof answer === 'number') {
        score += answer;
      } else if (answer === 'ja' || answer === true) {
        score += 1;
      }
    });
    
    setEligibilityScore(score);
  }, [checkAnswers]);

  // Step 1: Welcome
  const renderWelcome = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.title}>Willkommen bei SilenceNow</Text>
      <Text style={styles.subtitle}>
        Ihr rechtssicheres Lärm-Dokumentationssystem für Mietminderungen
      </Text>
      
      <View style={styles.featureList}>
        <Feature icon="📊" title="Automatische Messung" 
          desc="24/7 Dezibel-Monitoring ohne Audio-Aufnahme" />
        <Feature icon="🤖" title="KI-Klassifikation" 
          desc="Erkennt Musik, Bohren, Hunde, Kinderlärm" />
        <Feature icon="📄" title="BGH-konforme Protokolle" 
          desc="Gerichtsfeste Dokumentation mit Musterbriefen" />
        <Feature icon="🔒" title="Privacy-First" 
          desc="Keine Audio-Speicherung, nur Messwerte" />
      </View>
      
      <TouchableOpacity 
        style={styles.button}
        onPress={() => setCurrentStep(STEPS.CHECK_536B)}>
        <Text style={styles.buttonText}>Loslegen →</Text>
      </TouchableOpacity>
    </View>
  );

  // Step 2: §536b Check
  const render536bCheck = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.title}>§536b Check</Text>
      <Text style={styles.subtitle}>
        Prüfen wir kurz, ob Sie Mietminderungsansprüche haben könnten
      </Text>
      
      <ScrollView style={styles.questionsContainer}>
        {CHECK_536B_QUESTIONS.map((q, index) => (
          <View key={q.id} style={styles.questionCard}>
            <Text style={styles.questionNumber}>Frage {index + 1}</Text>
            <Text style={styles.questionText}>{q.question}</Text>
            
            {q.options ? (
              <View style={styles.optionsContainer}>
                {q.options.map(opt => (
                  <TouchableOpacity
                    key={opt.value}
                    style={[
                      styles.optionButton,
                      checkAnswers[q.id] === opt.value && styles.optionButtonSelected
                    ]}
                    onPress={() => setCheckAnswers({
                      ...checkAnswers,
                      [q.id]: opt.score !== undefined ? opt.score : opt.value
                    })}>
                    <Text style={[
                      styles.optionText,
                      checkAnswers[q.id] === opt.value && styles.optionTextSelected
                    ]}>{opt.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <View style={styles.yesNoContainer}>
                <TouchableOpacity
                  style={[
                    styles.yesNoButton,
                    checkAnswers[q.id] === true && styles.yesNoButtonSelected
                  ]}
                  onPress={() => setCheckAnswers({
                    ...checkAnswers,
                    [q.id]: true
                  })}>
                  <Text style={styles.yesNoText}>Ja</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.yesNoButton,
                    checkAnswers[q.id] === false && styles.noButtonSelected
                  ]}
                  onPress={() => setCheckAnswers({
                    ...checkAnswers,
                    [q.id]: false
                  })}>
                  <Text style={styles.yesNoText}>Nein</Text>
                </TouchableOpacity>
              </View>
            )}
            
            <Text style={styles.infoText}>ℹ️ {q.info}</Text>
          </View>
        ))}
      </ScrollView>
      
      <View style={styles.scoreContainer}>
        <Text style={styles.scoreLabel}>Einschätzung:</Text>
        <Text style={[
          styles.scoreValue,
          eligibilityScore >= 4 ? styles.scoreGood :
          eligibilityScore >= 2 ? styles.scoreMedium :
          styles.scoreLow
        ]}>
          {eligibilityScore >= 4 ? 'Gute Chancen ✅' :
           eligibilityScore >= 2 ? 'Moderate Chancen ⚠️' :
           'Wenig Aussichtsvoll ⚠️'}
        </Text>
      </View>
      
      <TouchableOpacity 
        style={styles.button}
        onPress={() => setCurrentStep(STEPS.PERMISSIONS)}>
        <Text style={styles.buttonText}>Weiter →</Text>
      </TouchableOpacity>
    </View>
  );

  // Step 3: Permissions
  const renderPermissions = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.title}>Berechtigungen</Text>
      <Text style={styles.subtitle}>
        Für die automatische Lärmüberwachung benötigen wir folgende Zugriffe:
      </Text>
      
      <View style={styles.permissionCard}>
        <Text style={styles.permissionIcon}>🎤</Text>
        <View style={styles.permissionContent}>
          <Text style={styles.permissionTitle}>Mikrofon-Zugriff</Text>
          <Text style={styles.permissionDesc}>
            Für die Dezibel-Messung. Wir nehmen KEIN Audio auf – nur Messwerte!
          </Text>
        </View>
      </View>
      
      <View style={styles.permissionCard}>
        <Text style={styles.permissionIcon}>🔔</Text>
        <View style={styles.permissionContent}>
          <Text style={styles.permissionTitle}>Benachrichtigungen</Text>
          <Text style={styles.permissionDesc}>
            Für Status-Updates und Erinnerungen zur Dokumentation.
          </Text>
        </View>
      </View>
      
      <View style={styles.permissionCard}>
        <Text style={styles.permissionIcon}>☁️</Text>
        <View style={styles.permissionContent}>
          <Text style={styles.permissionTitle}>Hintergrund-Aktivität</Text>
          <Text style={styles.permissionDesc}>
            Für 24/7 Monitoring auch wenn die App geschlossen ist.
          </Text>
        </View>
      </View>
      
      <View style={styles.privacyBox}>
        <Text style={styles.privacyTitle}>🔒 Privacy-First Garantie</Text>
        <Text style={styles.privacyText}>
          • Keine Audio-Aufnahmen{'\n'}
          • Keine Tonmitschnitte{'\n'}
          • Nur numerische Messwerte{'\n'}
          • DSGVO-konform & §201-StGB-konform
        </Text>
      </View>
      
      <TouchableOpacity 
        style={styles.button}
        onPress={() => setCurrentStep(STEPS.DSGVO)}>
        <Text style={styles.buttonText}>Berechtigungen erteilen →</Text>
      </TouchableOpacity>
    </View>
  );

  // Step 4: DSGVO
  const renderDSGVO = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.title}>Datenschutz-Einwilligung</Text>
      <Text style={styles.subtitle}>
        Ihre Daten gehören Ihnen. Wählen Sie, was erlaubt ist:
      </Text>
      
      <View style={styles.consentContainer}>
        <ConsentItem
          title="📊 Lärmmessung"
          desc="Speicherung von Dezibel-Werten und Frequenzdaten"
          required={true}
          value={consents.measurement}
          onChange={(v) => setConsents({...consents, measurement: v})}
        />
        
        <ConsentItem
          title="💾 Cloud-Sync"
          desc="Synchronisation mit sicherem Server (Backup)"
          required={false}
          value={consents.storage}
          onChange={(v) => setConsents({...consents, storage: v})}
        />
        
        <ConsentItem
          title="📤 Teilen mit Anwälten"
          desc="Protokolle können mit Anwälten geteilt werden"
          required={false}
          value={consents.sharing}
          onChange={(v) => setConsents({...consents, sharing: v})}
        />
        
        <ConsentItem
          title="📧 Produkt-Updates"
          desc="Informationen über neue Funktionen"
          required={false}
          value={consents.marketing}
          onChange={(v) => setConsents({...consents, marketing: v})}
        />
      </View>
      
      <View style={styles.legalNotice}>
        <Text style={styles.legalText}>
          <strong>Rechtliche Grundlagen:</strong>{'\n'}
          Die Verarbeitung erfolgt gemäß DSGVO Art. 6 (1) lit. a (Einwilligung) und 
          lit. b (Vertragserfüllung). Sie können Ihre Einwilligung jederzeit widerrufen.{'\n\n'}
          <strong>Datenlöschung:</strong>{'\n'}
          Ihre Daten werden nach 90 Tagen automatisch gelöscht oder können jederzeit 
          manuell gelöscht werden.
        </Text>
      </View>
      
      <TouchableOpacity 
        style={[styles.button, !consents.measurement && styles.buttonDisabled]}
        disabled={!consents.measurement}
        onPress={() => setCurrentStep(STEPS.AUTH)}>
        <Text style={styles.buttonText}>
          {consents.measurement ? 'Weiter →' : 'Messung erforderlich'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  // Step 5: Auth
  const renderAuth = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.title}>{isLogin ? 'Anmelden' : 'Konto erstellen'}</Text>
      <Text style={styles.subtitle}>
        Erstellen Sie ein Konto für sicheren Datenzugriff
      </Text>
      
      <View style={styles.authForm}>
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>E-Mail</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="ihre@email.de"
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>
        
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Passwort</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            secureTextEntry
          />
        </View>
        
        {isLoading ? (
          <ActivityIndicator size="large" color="#007AFF" />
        ) : (
          <TouchableOpacity 
            style={styles.button}
            onPress={handleAuth}>
            <Text style={styles.buttonText}>
              {isLogin ? 'Anmelden' : 'Konto erstellen'}
            </Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity 
          style={styles.switchButton}
          onPress={() => setIsLogin(!isLogin)}>
          <Text style={styles.switchText}>
            {isLogin ? 'Neu hier? Konto erstellen' : 'Bereits Konto? Anmelden'}
          </Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.guestOption}>
        <Text style={styles.guestText}>Oder:</Text>
        <TouchableOpacity onPress={handleGuestMode}>
          <Text style={styles.guestLink}>Als Gast fortfahren (lokal only)</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Auth Handler
  const handleAuth = async () => {
    if (!email || !password) {
      Alert.alert('Fehler', 'Bitte E-Mail und Passwort eingeben');
      return;
    }
    
    setIsLoading(true);
    
    try {
      let result;
      
      if (isLogin) {
        result = await supabase.auth.signInWithPassword({
          email,
          password
        });
      } else {
        result = await supabase.auth.signUp({
          email,
          password
        });
      }
      
      if (result.error) {
        throw result.error;
      }
      
      // Speichere Consents
      await saveConsents();
      
      // Onboarding complete
      onComplete && onComplete({
        user: result.data.user,
        eligibilityScore,
        consents
      });
      
    } catch (error) {
      Alert.alert('Fehler', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Guest Mode
  const handleGuestMode = async () => {
    await saveConsents();
    onComplete && onComplete({
      user: null,
      eligibilityScore,
      consents,
      isGuest: true
    });
  };

  // Save Consents
  const saveConsents = async () => {
    // Speichere Consents lokal
    // await AsyncStorage.setItem('user_consents', JSON.stringify(consents));
  };

  // Render current step
  const renderStep = () => {
    switch (currentStep) {
      case STEPS.WELCOME:
        return renderWelcome();
      case STEPS.CHECK_536B:
        return render536bCheck();
      case STEPS.PERMISSIONS:
        return renderPermissions();
      case STEPS.DSGVO:
        return renderDSGVO();
      case STEPS.AUTH:
        return renderAuth();
      default:
        return renderWelcome();
    }
  };

  return (
    <View style={styles.container}>
      {/* Progress Indicator */}
      <View style={styles.progressBar}>
        {Object.values(STEPS).map((step, index) => (
          <View 
            key={step}
            style={[
              styles.progressDot,
              currentStep >= step && styles.progressDotActive
            ]} 
          />
        ))}
      </View>
      
      {renderStep()}
    </View>
  );
}

// Hilfskomponenten
function Feature({ icon, title, desc }) {
  return (
    <View style={styles.featureItem}>
      <Text style={styles.featureIcon}>{icon}</Text>
      <View>
        <Text style={styles.featureTitle}>{title}</Text>
        <Text style={styles.featureDesc}>{desc}</Text>
      </View>
    </View>
  );
}

function ConsentItem({ title, desc, required, value, onChange }) {
  return (
    <View style={styles.consentItem}>
      <View style={styles.consentTextContainer}>
        <Text style={styles.consentTitle}>
          {title} {required && <Text style={styles.required}>*</Text>}
        </Text>
        <Text style={styles.consentDesc}>{desc}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        disabled={required}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff'
  },
  progressBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    padding: 20,
    gap: 8
  },
  progressDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#ddd'
  },
  progressDotActive: {
    backgroundColor: '#007AFF'
  },
  stepContainer: {
    flex: 1,
    padding: 20
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#1a1a1a'
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20
  },
  buttonDisabled: {
    backgroundColor: '#ccc'
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  },
  // Welcome styles
  featureList: {
    marginVertical: 20
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 12
  },
  featureIcon: {
    fontSize: 32,
    marginRight: 16
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600'
  },
  featureDesc: {
    fontSize: 14,
    color: '#666'
  },
  // Check 536b styles
  questionsContainer: {
    flex: 1
  },
  questionCard: {
    backgroundColor: '#f8f8f8',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16
  },
  questionNumber: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '600',
    marginBottom: 8
  },
  questionText: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 12
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  optionButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#e8e8e8',
    borderRadius: 20
  },
  optionButtonSelected: {
    backgroundColor: '#007AFF'
  },
  optionText: {
    color: '#333'
  },
  optionTextSelected: {
    color: '#fff'
  },
  yesNoContainer: {
    flexDirection: 'row',
    gap: 12
  },
  yesNoButton: {
    flex: 1,
    padding: 12,
    backgroundColor: '#e8e8e8',
    borderRadius: 10,
    alignItems: 'center'
  },
  yesNoButtonSelected: {
    backgroundColor: '#34C759'
  },
  noButtonSelected: {
    backgroundColor: '#FF3B30'
  },
  yesNoText: {
    fontWeight: '500'
  },
  infoText: {
    fontSize: 12,
    color: '#666',
    marginTop: 12
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    marginBottom: 20
  },
  scoreLabel: {
    fontSize: 16,
    fontWeight: '500'
  },
  scoreValue: {
    fontSize: 16,
    fontWeight: '600'
  },
  scoreGood: {
    color: '#34C759'
  },
  scoreMedium: {
    color: '#FF9500'
  },
  scoreLow: {
    color: '#FF3B30'
  },
  // Permissions styles
  permissionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    marginBottom: 12
  },
  permissionIcon: {
    fontSize: 28,
    marginRight: 16
  },
  permissionContent: {
    flex: 1
  },
  permissionTitle: {
    fontSize: 16,
    fontWeight: '600'
  },
  permissionDesc: {
    fontSize: 14,
    color: '#666',
    marginTop: 4
  },
  privacyBox: {
    backgroundColor: '#E8F5E9',
    padding: 16,
    borderRadius: 12,
    marginVertical: 20
  },
  privacyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2E7D32'
  },
  privacyText: {
    fontSize: 14,
    color: '#1B5E20',
    marginTop: 8,
    lineHeight: 20
  },
  // DSGVO styles
  consentContainer: {
    marginVertical: 20
  },
  consentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e8e8e8'
  },
  consentTextContainer: {
    flex: 1,
    marginRight: 16
  },
  consentTitle: {
    fontSize: 16,
    fontWeight: '500'
  },
  consentDesc: {
    fontSize: 13,
    color: '#666',
    marginTop: 2
  },
  required: {
    color: '#FF3B30'
  },
  legalNotice: {
    backgroundColor: '#FFF8E1',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20
  },
  legalText: {
    fontSize: 12,
    color: '#666',
    lineHeight: 18
  },
  // Auth styles
  authForm: {
    marginVertical: 20
  },
  inputContainer: {
    marginBottom: 16
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    color: '#333'
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 14,
    fontSize: 16
  },
  switchButton: {
    marginTop: 16,
    alignItems: 'center'
  },
  switchText: {
    color: '#007AFF',
    fontSize: 14
  },
  guestOption: {
    marginTop: 30,
    alignItems: 'center'
  },
  guestText: {
    color: '#666',
    marginBottom: 8
  },
  guestLink: {
    color: '#007AFF',
    fontSize: 14
  }
});
