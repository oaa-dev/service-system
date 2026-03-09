import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:get_it/get_it.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_typography.dart';
import '../../../loyalty/presentation/bloc/loyalty_cards/loyalty_cards_bloc.dart';
import '../../../loyalty/presentation/bloc/qr_scanner/qr_scanner_bloc.dart';
import '../../../loyalty/presentation/pages/loyalty_page.dart';
import '../../../coupons/presentation/bloc/coupons_bloc.dart';
import '../../../coupons/presentation/pages/coupons_page.dart';
import '../../../referrals/presentation/bloc/referrals_bloc.dart';
import '../../../referrals/presentation/pages/referrals_page.dart';

class RewardsTabPage extends StatefulWidget {
  const RewardsTabPage({super.key});

  @override
  State<RewardsTabPage> createState() => _RewardsTabPageState();
}

class _RewardsTabPageState extends State<RewardsTabPage>
    with SingleTickerProviderStateMixin, AutomaticKeepAliveClientMixin {
  @override
  bool get wantKeepAlive => true;

  late final TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    super.build(context);
    final sl = GetIt.instance;
    return MultiBlocProvider(
      providers: [
        BlocProvider(create: (_) => sl<LoyaltyCardsBloc>()),
        BlocProvider(create: (_) => sl<QrScannerBloc>()),
        BlocProvider(create: (_) => sl<CouponsBloc>()),
        BlocProvider(create: (_) => sl<ReferralsBloc>()),
      ],
      child: Scaffold(
        backgroundColor: AppColors.surface,
        appBar: AppBar(
          title: Text('Rewards', style: AppTypography.titleLarge),
          backgroundColor: AppColors.white,
          elevation: 0,
          scrolledUnderElevation: 0.5,
          bottom: TabBar(
            controller: _tabController,
            labelColor: AppColors.primary,
            unselectedLabelColor: AppColors.grey400,
            indicatorColor: AppColors.primary,
            indicatorWeight: 3,
            labelStyle: AppTypography.labelMedium,
            unselectedLabelStyle: AppTypography.labelMedium,
            tabs: const [
              Tab(icon: Icon(Icons.loyalty_rounded, size: 20), text: 'Loyalty'),
              Tab(
                  icon: Icon(Icons.local_offer_rounded, size: 20),
                  text: 'Coupons'),
              Tab(
                  icon: Icon(Icons.people_rounded, size: 20),
                  text: 'Referrals'),
            ],
          ),
        ),
        body: TabBarView(
          controller: _tabController,
          children: const [
            LoyaltyPage(),
            CouponsPage(),
            ReferralsPage(),
          ],
        ),
      ),
    );
  }
}
