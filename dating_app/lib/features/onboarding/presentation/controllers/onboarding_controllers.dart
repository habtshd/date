import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/profile_repository.dart';
import '../../domain/user_profile.dart';
import '../../domain/preferences.dart';
import '../../domain/interest.dart';
import '../../domain/profile_photo.dart';
import '../../../auth/data/auth_repository.dart';

// 1. Profile Controller
class ProfileState {
  final bool isLoading;
  final UserProfile? profile;
  final String? error;

  const ProfileState({
    this.isLoading = false,
    this.profile,
    this.error,
  });

  ProfileState copyWith({
    bool? isLoading,
    UserProfile? profile,
    String? error,
  }) {
    return ProfileState(
      isLoading: isLoading ?? this.isLoading,
      profile: profile ?? this.profile,
      error: error,
    );
  }
}

class ProfileController extends Notifier<ProfileState> {
  ProfileRepository get _repo => ref.read(profileRepositoryProvider);

  @override
  ProfileState build() {
    _loadProfile();
    return const ProfileState(isLoading: false);
  }

  Future<void> _loadProfile() async {
    final p = await _repo.fetchProfile();
    state = state.copyWith(isLoading: false, profile: p);
  }

  Future<bool> saveProfile(UserProfile profile) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final saved = await _repo.saveBasicProfile(profile);
      state = state.copyWith(isLoading: false, profile: saved);

      // Update auth user hasProfile state
      final currentAuth = ref.read(authStateProvider);
      if (currentAuth.user != null) {
        ref.read(authStateProvider.notifier).updateUser(
              currentAuth.user!.copyWith(hasProfile: true),
            );
      }
      return true;
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.toString().replaceAll('Exception: ', ''),
      );
      return false;
    }
  }
}

final profileControllerProvider =
    NotifierProvider<ProfileController, ProfileState>(() {
  return ProfileController();
});

// 2. Preferences Controller
class PreferencesState {
  final bool isLoading;
  final Preferences preferences;
  final String? error;

  const PreferencesState({
    this.isLoading = false,
    this.preferences = const Preferences(),
    this.error,
  });

  PreferencesState copyWith({
    bool? isLoading,
    Preferences? preferences,
    String? error,
  }) {
    return PreferencesState(
      isLoading: isLoading ?? this.isLoading,
      preferences: preferences ?? this.preferences,
      error: error,
    );
  }
}

class PreferencesController extends Notifier<PreferencesState> {
  ProfileRepository get _repo => ref.read(profileRepositoryProvider);

  @override
  PreferencesState build() {
    _loadPreferences();
    return const PreferencesState();
  }

  Future<void> _loadPreferences() async {
    final p = await _repo.fetchPreferences();
    if (p != null) {
      state = state.copyWith(preferences: p);
    }
  }

  Future<bool> savePreferences(Preferences preferences) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final saved = await _repo.savePreferences(preferences);
      state = state.copyWith(isLoading: false, preferences: saved);
      return true;
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.toString().replaceAll('Exception: ', ''),
      );
      return false;
    }
  }
}

final preferencesControllerProvider =
    NotifierProvider<PreferencesController, PreferencesState>(() {
  return PreferencesController();
});

// 3. Interests Controller
class InterestsState {
  final bool isLoading;
  final List<Interest> availableInterests;
  final Set<String> selectedInterestIds;
  final String? error;

  const InterestsState({
    this.isLoading = false,
    this.availableInterests = const [],
    this.selectedInterestIds = const {},
    this.error,
  });

  InterestsState copyWith({
    bool? isLoading,
    List<Interest>? availableInterests,
    Set<String>? selectedInterestIds,
    String? error,
  }) {
    return InterestsState(
      isLoading: isLoading ?? this.isLoading,
      availableInterests: availableInterests ?? this.availableInterests,
      selectedInterestIds: selectedInterestIds ?? this.selectedInterestIds,
      error: error,
    );
  }
}

class InterestsController extends Notifier<InterestsState> {
  ProfileRepository get _repo => ref.read(profileRepositoryProvider);

  @override
  InterestsState build() {
    _loadInterests();
    return const InterestsState(
      isLoading: false,
      availableInterests: [
        Interest(id: '1', name: '☕ Coffee Ceremony', category: 'Culture'),
        Interest(id: '2', name: '🏔️ Simien Mountains', category: 'Travel'),
        Interest(id: '3', name: '🎵 Ethio-Jazz & Music', category: 'Art'),
        Interest(id: '4', name: '💻 Tech & Startups', category: 'Professional'),
        Interest(id: '5', name: '📚 Ethiopian History', category: 'Education'),
        Interest(id: '6', name: '🍲 Traditional Cooking', category: 'Lifestyle'),
        Interest(id: '7', name: '🏃 Athletics & Running', category: 'Fitness'),
        Interest(id: '8', name: '🎨 Visual Art & Heritage', category: 'Culture'),
        Interest(id: '9', name: '✈️ World Travel', category: 'Lifestyle'),
        Interest(id: '10', name: '📖 Literature & Poetry', category: 'Education'),
        Interest(id: '11', name: '⚽ Football', category: 'Sports'),
        Interest(id: '12', name: '🌱 Social Impact', category: 'Community'),
      ],
    );
  }

  Future<void> _loadInterests() async {
    final list = await _repo.fetchInterests();
    final profile = await _repo.fetchProfile();
    final currentSelected = profile?.interests.map((i) => i.id).toSet() ?? {};

    state = state.copyWith(
      isLoading: false,
      availableInterests: list,
      selectedInterestIds: currentSelected,
    );
  }

  void toggleInterest(String id) {
    final set = Set<String>.from(state.selectedInterestIds);
    if (set.contains(id)) {
      set.remove(id);
    } else {
      set.add(id);
    }
    state = state.copyWith(selectedInterestIds: set, error: null);
  }

  Future<bool> saveInterests() async {
    if (state.selectedInterestIds.length < 3) {
      state = state.copyWith(error: 'Please select at least 3 interests');
      return false;
    }

    state = state.copyWith(isLoading: true, error: null);
    try {
      await _repo.saveInterests(state.selectedInterestIds.toList());
      state = state.copyWith(isLoading: false);
      return true;
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.toString().replaceAll('Exception: ', ''),
      );
      return false;
    }
  }
}

final interestsControllerProvider =
    NotifierProvider<InterestsController, InterestsState>(() {
  return InterestsController();
});

// 4. Photos Controller
class PhotosState {
  final bool isLoading;
  final List<ProfilePhoto> photos;
  final String? error;

  const PhotosState({
    this.isLoading = false,
    this.photos = const [],
    this.error,
  });

  PhotosState copyWith({
    bool? isLoading,
    List<ProfilePhoto>? photos,
    String? error,
  }) {
    return PhotosState(
      isLoading: isLoading ?? this.isLoading,
      photos: photos ?? this.photos,
      error: error,
    );
  }
}

class PhotosController extends Notifier<PhotosState> {
  ProfileRepository get _repo => ref.read(profileRepositoryProvider);

  @override
  PhotosState build() {
    _loadPhotos();
    return const PhotosState(isLoading: true);
  }

  Future<void> _loadPhotos() async {
    final p = await _repo.fetchProfile();
    state = state.copyWith(
      isLoading: false,
      photos: p?.photos ?? [],
    );
  }

  Future<bool> uploadPhoto({
    required List<int> bytes,
    required String contentType,
  }) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final isFirst = state.photos.isEmpty;
      final newPhoto = await _repo.uploadPhoto(
        bytes: bytes,
        contentType: contentType,
        isPrimary: isFirst,
      );

      state = state.copyWith(
        isLoading: false,
        photos: [...state.photos, newPhoto],
      );
      return true;
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.toString().replaceAll('Exception: ', ''),
      );
      return false;
    }
  }

  Future<void> setPrimary(String photoId) async {
    try {
      await _repo.setPrimaryPhoto(photoId);
      final updated = state.photos.map((p) {
        return p.copyWith(isPrimary: p.id == photoId);
      }).toList();
      state = state.copyWith(photos: updated);
    } catch (_) {}
  }

  Future<void> deletePhoto(String photoId) async {
    try {
      await _repo.deletePhoto(photoId);
      final updated = state.photos.where((p) => p.id != photoId).toList();
      state = state.copyWith(photos: updated);
    } catch (_) {}
  }
}

final photosControllerProvider =
    NotifierProvider<PhotosController, PhotosState>(() {
  return PhotosController();
});

// 5. Overall Onboarding Controller
class OnboardingController extends Notifier<OnboardingProgress?> {
  ProfileRepository get _repo => ref.read(profileRepositoryProvider);

  @override
  OnboardingProgress? build() {
    return null;
  }

  Future<OnboardingProgress> checkProgress() async {
    final progress = await _repo.checkOnboardingProgress();
    state = progress;
    return progress;
  }
}

final onboardingControllerProvider =
    NotifierProvider<OnboardingController, OnboardingProgress?>(() {
  return OnboardingController();
});
